const path = require('node:path');
const { Worker } = require('node:worker_threads');
const vscode = require('vscode');
let palette = require('./palette.json');
const themeVariants = require('./theme-variants.json');
const { supportedLanguages, maximumDocumentLength } = require('./refine');

const variantByLabel = new Map(
  themeVariants.map((variant) => [variant.label, variant]),
);

function activate(context) {
  const decorations = new Map();
  const cache = new Map();
  const timers = new Map();
  const requests = new Map();
  const queued = new Map();
  let worker;
  let sequence = 0;
  let disposed = false;
  let failures = 0;
  const output = vscode.window.createOutputChannel('CodePen Syntax Refinement');
  const activeVariant = () => variantByLabel.get(
    vscode.workspace.getConfiguration('workbench').get('colorTheme'),
  );
  const enabled = (document) => !disposed && failures < 3 && activeVariant() &&
    vscode.workspace.getConfiguration('codepen.syntaxRefinement', document).get('enabled', true) &&
    supportedLanguages.includes(document.languageId) && document.getText().length <= maximumDocumentLength;

  function decoration(span) {
    // Contextual colors are shared by both variants. Original suppresses
    // theme-owned italics, while Ligatures retains them.
    const fontStyle = activeVariant()?.italics ? span.fontStyle : undefined;
    const key = `${span.role}:${fontStyle ?? ''}`;
    if (!decorations.has(key)) decorations.set(key, vscode.window.createTextEditorDecorationType({
      color: palette[span.role], ...(fontStyle ? { fontStyle } : {}),
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    }));
    return decorations.get(key);
  }
  function clear(editor) {
    for (const type of decorations.values()) editor.setDecorations(type, []);
  }
  function apply(editor, spans) {
    const groups = new Map();
    for (const span of spans) {
      const type = decoration(span);
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(new vscode.Range(editor.document.positionAt(span.start), editor.document.positionAt(span.end)));
    }
    for (const type of decorations.values()) editor.setDecorations(type, groups.get(type) ?? []);
  }
  function stopWorker() {
    const current = worker;
    worker = undefined;
    if (current) void current.terminate();
    for (const request of requests.values()) clearTimeout(request.timeout);
    requests.clear();
    queued.clear();
  }
  function fail(error) {
    failures++;
    output.appendLine(`Refinement stopped: ${error.message ?? error}. Grammar and semantic highlighting remain active.`);
    stopWorker();
    cache.clear();
    for (const editor of vscode.window.visibleTextEditors) clear(editor);
  }
  function getWorker() {
    if (worker) return worker;
    const current = worker = new Worker(path.join(__dirname, 'worker.js'));
    current.on('error', (error) => { if (worker === current) fail(error); });
    current.on('exit', (code) => { if (worker === current && code !== 0) fail(new Error(`Worker exited (${code})`)); });
    current.on('message', (message) => {
      const request = requests.get(message.id);
      if (!request || worker !== current) return;
      clearTimeout(request.timeout);
      requests.delete(message.id);
      const { document, version, uri } = request;
      if (message.error) output.appendLine(`${document.languageId}: ${message.error}`);
      else if (!document.isClosed && document.version === version && enabled(document)) {
        cache.set(uri, { version, spans: message.spans });
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document === document) apply(editor, message.spans);
        }
      }
      pump();
    });
    return current;
  }
  function pump() {
    if (requests.size || !queued.size) return;
    const [uri, document] = queued.entries().next().value;
    queued.delete(uri);
    if (!enabled(document) || document.isClosed) { pump(); return; }
    const id = ++sequence;
    const timeout = setTimeout(() => fail(new Error('Parser exceeded the 5 second deadline')), 5000);
    requests.set(id, { uri, document, version: document.version, timeout });
    getWorker().postMessage({ id, source: document.getText(), language: document.languageId });
  }
  function schedule(editor, delay = 80) {
    const document = editor.document;
    const uri = document.uri.toString();
    clearTimeout(timers.get(uri));
    timers.delete(uri);
    if (!enabled(document)) { clear(editor); cache.delete(uri); return; }
    const saved = cache.get(uri);
    if (saved?.version === document.version) { apply(editor, saved.spans); return; }
    clear(editor);
    timers.set(uri, setTimeout(() => {
      timers.delete(uri);
      if (!enabled(document) || document.isClosed) return;
      // At most one parse is running and one latest version is queued per URI.
      queued.set(uri, document);
      pump();
    }, delay));
  }
  function refresh() {
    cache.clear();
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    stopWorker();
    failures = 0;
    for (const editor of vscode.window.visibleTextEditors) schedule(editor, 0);
  }
  context.subscriptions.push(output,
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
      const visible = new Set(editors.map((editor) => editor.document.uri.toString()));
      for (const uri of cache.keys()) if (!visible.has(uri)) cache.delete(uri);
      for (const uri of queued.keys()) if (!visible.has(uri)) queued.delete(uri);
      for (const editor of editors) schedule(editor);
    }),
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      for (const editor of vscode.window.visibleTextEditors) if (editor.document === document) schedule(editor);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      const uri = document.uri.toString();
      clearTimeout(timers.get(uri)); timers.delete(uri); cache.delete(uri);
      queued.delete(uri);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('workbench.colorTheme') || event.affectsConfiguration('codepen.syntaxRefinement')) refresh();
    }),
    { dispose() {
      disposed = true;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear(); stopWorker(); cache.clear();
      for (const type of decorations.values()) type.dispose();
      decorations.clear();
    } },
  );
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(context.extensionUri, 'runtime/palette.json'));
    const reloadPalette = () => {
      try {
        palette = JSON.parse(require('node:fs').readFileSync(path.join(__dirname, 'palette.json'), 'utf8'));
        for (const type of decorations.values()) type.dispose();
        decorations.clear();
        refresh();
      } catch (error) { output.appendLine(`Palette reload failed: ${error.message}`); }
    };
    context.subscriptions.push(watcher, watcher.onDidChange(reloadPalette), watcher.onDidCreate(reloadPalette));
  }
  refresh();
  // Read-only integration-test evidence; no workspace content is logged or saved.
  return { getState: () => ({ pending: requests.size + timers.size + queued.size, failures,
    documents: [...cache.entries()].map(([uri, entry]) => ({ uri, ...entry })) }) };
}

module.exports = { activate };
