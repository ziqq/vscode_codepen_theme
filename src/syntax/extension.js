/**
 * @file Own theme-scoped editor decorations, worker scheduling, and Dart constant resolution.
 * Async replies are scoped to a worker identity, document version, and active theme.
 */

/**
 * @typedef {object} RefinementApi
 * @property {() => {pending: number, failures: number, documents: {uri: string, version: number, spans: import('./spans').Span[]}[]}} getState Read-only evidence for integration tests; excludes source text.
 */

const path = require('node:path');
const { Worker } = require('node:worker_threads');
const vscode = require('vscode');
let palette = require('./palette.json');
const themeVariants = require('./theme-variants.json');
const { supportedLanguages, maximumDocumentLength } = require('./refine');
const { resolveDartConstants } = require('./dart-constants');

const variantByLabel = new Map(
  themeVariants.map((variant) => [variant.label, variant]),
);

/**
 * Activate theme-scoped decorations, serialized parsing, and Dart definition checks.
 * Every async result is guarded by worker identity, document version, and theme state.
 *
 * @param {import('vscode').ExtensionContext} context Owns subscriptions, output, workers, and decoration disposal.
 * @returns {RefinementApi} Read-only integration evidence; source text is never included.
 */
function activate(context) {
  const decorations = new Map();
  // Cache only the exact parsed version; editor-shifted ranges are temporary
  // presentation and never become evidence for a later document version.
  const cache = new Map();
  const timers = new Map();
  const requests = new Map();
  const queued = new Map();
  const resolving = new Map();
  let worker;
  let sequence = 0;
  let disposed = false;
  let failures = 0;
  const output = vscode.window.createOutputChannel('CodePen Syntax Refinement');
  /**
   * Look up the exact active public label; unrelated themes never enable refinement.
   * @type {() => import('../theme-variants').ThemeVariant | undefined}
   */
  const activeVariant = () => variantByLabel.get(
    vscode.workspace.getConfiguration('workbench').get('colorTheme'),
  );
  /**
   * Check lifecycle, failure budget, theme, per-resource opt-out, language, and size gates.
   * @type {(document: import('vscode').TextDocument) => boolean | import('../theme-variants').ThemeVariant | undefined}
   */
  const enabled = (document) => !disposed && failures < 3 && activeVariant() &&
    vscode.workspace.getConfiguration('codepen.syntaxRefinement', document).get('enabled', true) &&
    supportedLanguages.includes(document.languageId) && document.getText().length <= maximumDocumentLength;

  /**
   * Reuse a decoration by role and effective typography for the active variant.
   *
   * @param {import('./spans').Span} span Foreground range whose style is required.
   * @returns {import('vscode').TextEditorDecorationType} Cached decoration shared by all matching spans.
   */
  function decoration(span) {
    // Contextual colors are shared by both variants. Original suppresses the
    // general italic layer; provider-marked annotations are the exception.
    const fontStyle = span.fontStyle === 'annotation'
      ? 'italic'
      : activeVariant()?.italics ? span.fontStyle : undefined;
    const key = `${span.role}:${fontStyle ?? ''}`;
    if (!decorations.has(key)) decorations.set(key, vscode.window.createTextEditorDecorationType({
      color: palette[span.role], ...(fontStyle ? { fontStyle } : {}),
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
    }));
    return decorations.get(key);
  }
  /**
   * Remove all theme-owned decorations from an editor.
   *
   * @param {import('vscode').TextEditor} editor Editor losing its refinement layer.
   * @returns {void} Language-provider highlighting remains underneath.
   */
  function clear(editor) {
    for (const type of decorations.values()) editor.setDecorations(type, []);
  }
  /**
   * Group spans by style and replace the editor's complete decoration set.
   *
   * @param {import('vscode').TextEditor} editor Editor for the parsed document version.
   * @param {import('./spans').Span[]} spans Sorted ranges in document offsets.
   * @returns {void} Absent style groups are explicitly cleared.
   */
  function apply(editor, spans) {
    const groups = new Map();
    for (const span of spans) {
      const type = decoration(span);
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(new vscode.Range(editor.document.positionAt(span.start), editor.document.positionAt(span.end)));
    }
    for (const type of decorations.values()) editor.setDecorations(type, groups.get(type) ?? []);
  }
  /**
   * Terminate the worker and settle pending definition checks before clearing queues.
   *
   * @returns {void} In-flight replies become stale by worker identity.
   */
  function stopWorker() {
    /**
     * Reject Dart resolution after a worker, task, document version, or theme changes.
     * @type {() => boolean}
     */
    const current = worker;
    worker = undefined;
    if (current) void current.terminate();
    for (const request of requests.values()) {
      clearTimeout(request.timeout);
      request.complete?.({ error: 'Parser stopped' });
    }
    resolving.clear();
    requests.clear();
    queued.clear();
  }
  /**
   * Fall back to provider highlighting after a worker error or deadline violation.
   *
   * @param {Error | {message?: string}} error Failure reported by the worker or watchdog.
   * @returns {void} Repeated failures disable refinement until refresh.
   */
  function fail(error) {
    failures++;
    output.appendLine(`Refinement stopped: ${error.message ?? error}. Grammar and semantic highlighting remain active.`);
    stopWorker();
    cache.clear();
    for (const editor of vscode.window.visibleTextEditors) clear(editor);
  }
  /**
   * Create the parser worker lazily and attach guarded reply/error handlers.
   *
   * @returns {import('node:worker_threads').Worker} The current worker instance.
   */
  function getWorker() {
    if (worker) return worker;
    /**
     * Reject Dart resolution after a worker, task, document version, or theme changes.
     * @type {() => boolean}
     */
    const current = worker = new Worker(path.join(__dirname, 'worker.js'));
    current.on('error', (error) => { if (worker === current) fail(error); });
    current.on('exit', (code) => { if (worker === current && code !== 0) fail(new Error(`Worker exited (${code})`)); });
    current.on('message', (message) => {
      const request = requests.get(message.id);
      if (!request || worker !== current) return;
      clearTimeout(request.timeout);
      requests.delete(message.id);
      // Definition inspection shares the worker but returns booleans, not decorations.
      if (request.complete) { request.complete(message); pump(); return; }
      const { document, version, uri } = request;
      if (message.error) output.appendLine(`${document.languageId}: ${message.error}`);
      else if (!document.isClosed && document.version === version && enabled(document)) {
        cache.set(uri, { version, spans: message.spans });
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document === document) apply(editor, message.spans);
        }
        if (document.languageId === 'dart') resolveConstants(document, version, message.spans, current);
      }
      pump();
    });
    return current;
  }
  /**
   * Run provider-backed Dart resolution after the structural foreground pass.
   *
   * @param {import('vscode').TextDocument} document Referencing document.
   * @param {number} version Version that produced the structural spans.
   * @param {import('./spans').Span[]} spans Foregrounds to preserve except confirmed constants.
   * @param {import('node:worker_threads').Worker} parser Worker identity binding this task to the current lifecycle.
   * @returns {void} Resolved spans are applied only while this exact task remains current.
   */
  function resolveConstants(document, version, spans, parser) {
    const uri = document.uri.toString();
    const task = {};
    resolving.set(uri, task);
    /**
     * Reject Dart resolution after a worker, task, document version, or theme changes.
     * @type {() => boolean}
     */
    const current = () => worker === parser && resolving.get(uri) === task &&
      !document.isClosed && document.version === version && enabled(document);
    /**
     * Submit declaration-offset inspection to the same serialized parser worker.
     * @type {(source: string, constantOffsets: number[]) => Promise<boolean[]>}
     */
    const analyze = (source, constantOffsets) => new Promise((resolve, reject) => {
      if (!current()) { reject(new Error('Document changed')); return; }
      const id = ++sequence;
      const timeout = setTimeout(() => fail(new Error('Parser exceeded the 5 second deadline')), 5000);
      requests.set(id, { timeout, complete: (message) => message.error
        ? reject(new Error(message.error)) : resolve(message.constants) });
      parser.postMessage({ id, source, constantOffsets });
    });
    void resolveDartConstants(document, spans, analyze, current).then((resolved) => {
      if (!current()) return;
      cache.set(uri, { version, spans: resolved });
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === document) apply(editor, resolved);
      }
    }).catch((error) => {
      if (current()) output.appendLine(`Dart constant resolution: ${error.message ?? error}`);
    }).finally(() => { if (resolving.get(uri) === task) resolving.delete(uri); });
  }
  /**
   * Start one queued document parse when no worker request is in flight.
   *
   * @returns {void} At most the latest queued version of each URI is retained.
   */
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
  /**
   * Debounce parsing while preserving edit-shifted decorations to avoid color flashes.
   *
   * @param {import('vscode').TextEditor} editor Visible editor to refine.
   * @param {number} [delay=80] Debounce interval in milliseconds.
   * @param {boolean} [keep=false] Retain existing ranges until fresh results replace them.
   * @returns {void} Valid cached versions can be reapplied synchronously.
   */
  function schedule(editor, delay = 80, keep = false) {
    const document = editor.document;
    const uri = document.uri.toString();
    clearTimeout(timers.get(uri));
    timers.delete(uri);
    if (!enabled(document)) { clear(editor); cache.delete(uri); return; }
    const saved = cache.get(uri);
    if (saved?.version === document.version) { apply(editor, saved.spans); return; }
    // Edits keep their decorations (VS Code shifts or drops the ranges) so
    // contextual colors do not flash to the semantic layer before the re-parse.
    if (!keep) clear(editor);
    timers.set(uri, setTimeout(() => {
      timers.delete(uri);
      if (!enabled(document) || document.isClosed) return;
      // At most one parse is running and one latest version is queued per URI.
      queued.set(uri, document);
      pump();
    }, delay));
  }
  /**
   * Invalidate caches and restart visible editors after theme or refinement changes.
   *
   * @returns {void} Worker failures and stale queues are reset.
   */
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
      for (const [uri, timer] of timers) if (!visible.has(uri)) {
        clearTimeout(timer);
        timers.delete(uri);
      }
      for (const uri of queued.keys()) if (!visible.has(uri)) queued.delete(uri);
      for (const editor of editors) schedule(editor, 0, true);
    }),
    vscode.workspace.onDidChangeTextDocument(({ document, contentChanges }) => {
      if (!contentChanges.length) return;
      if (document.languageId === 'dart') {
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document !== document && editor.document.languageId === 'dart') {
            cache.delete(editor.document.uri.toString());
            schedule(editor, 80, true);
          }
        }
      }
      cache.delete(document.uri.toString());
      resolving.delete(document.uri.toString());
      for (const editor of vscode.window.visibleTextEditors) if (editor.document === document) schedule(editor, 80, true);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      const uri = document.uri.toString();
      clearTimeout(timers.get(uri)); timers.delete(uri); cache.delete(uri); resolving.delete(uri);
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
    /**
     * Reload development-only palette changes, disposing stale decoration styles first.
     * @type {() => void}
     */
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
  return { getState: () => ({ pending: requests.size + timers.size + queued.size + resolving.size, failures,
    documents: [...cache.entries()].map(([uri, entry]) => ({ uri, ...entry })) }) };
}

module.exports = { activate };
