/** @file Lazy Monaco adapter for three editable preview models. No language server is loaded. */
import * as monaco from 'monaco-editor/editor/editor.api.js';
import palette from '../../../src/colors.js';
import theme from '../../../themes/codepen-theme.json';
import typescript from '../../fixtures/javascript/index.tsx';
import dart from '../../fixtures/dart/main.dart';
import rust from '../../fixtures/rust/main.rs';

// The browser editor uses its own worker, never the VS Code extension host.
globalThis.MonacoEnvironment = {
  getWorker: () => new Worker(new URL('./editor.worker.js', import.meta.url), { type: 'module' }),
};
monaco.editor.defineTheme('codepen-preview', {
  base: 'vs-dark', inherit: false,
  rules: [{ token: '', foreground: palette.white.slice(1) }],
  colors: Object.fromEntries(Object.entries(theme.colors).filter(([key]) =>
    /^(?:editor\.|editorLineNumber\.|editorWidget\.|scrollbarSlider\.)/.test(key))),
});
const samples = { typescript, dart, rust };

/** Create one editor; separate models retain each language's edits and undo history. */
export function createPreview(container) {
  const models = new Map();
  const views = new Map();
  let language = 'typescript';
  const modelFor = (name) => {
    if (!models.has(name)) models.set(name, monaco.editor.createModel(samples[name], 'plaintext'));
    return models.get(name);
  };
  const editor = monaco.editor.create(container, {
    model: modelFor(language), theme: 'codepen-preview', automaticLayout: true,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: 14, lineHeight: 24, minimap: { enabled: false },
    scrollBeyondLastLine: false, overviewRulerLanes: 0, hideCursorInOverviewRuler: true,
    renderLineHighlight: 'line', padding: { top: 16, bottom: 16 },
    stickyScroll: { enabled: false }, folding: false, glyphMargin: false,
    lineNumbersMinChars: 3, bracketPairColorization: { enabled: false },
    matchBrackets: 'never', guides: { bracketPairs: false },
    quickSuggestions: false, suggestOnTriggerCharacters: false, wordBasedSuggestions: 'off',
    accessibilitySupport: 'auto', ariaLabel: 'Editable CodePen theme code example',
    tabIndex: 0, tabSize: 2, insertSpaces: true,
  });
  const worker = new Worker(new URL('./theme.worker.js', import.meta.url), { type: 'module' });
  const requests = new Map();
  const decorations = editor.createDecorationsCollection();
  const styleSheet = document.createElement('style');
  document.head.append(styleSheet);
  const classes = new Map();
  const hint = container.parentElement.querySelector('.editor-hint');
  let nextId = 0;
  let timer;

  function classFor(span) {
    const key = `${span.foreground.slice(1)}-${span.fontStyle}`;
    if (!classes.has(key)) {
      const name = `cp-theme-${key}`;
      const bits = span.fontStyle;
      const decoration = [bits & 4 ? 'underline' : '', bits & 8 ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
      styleSheet.sheet.insertRule(`.${name} { color: ${span.foreground} !important; font-style: ${bits & 1 ? 'italic' : 'normal'} !important; font-weight: ${bits & 2 ? 'bold' : 'normal'} !important; text-decoration: ${decoration} !important; }`);
      classes.set(key, name);
    }
    return classes.get(key);
  }

  worker.addEventListener('message', ({ data }) => {
    const request = requests.get(data.id);
    if (!request) return;
    requests.delete(data.id);
    if (data.error) {
      hint.textContent = `Theme highlighting unavailable: ${data.error}`;
      request.reject(new Error(data.error));
      return;
    }
    // A slow parser response must never repaint a newer edit or another language.
    if (editor.getModel() === request.model && request.model.getVersionId() === request.version) {
      decorations.set(data.spans.map(span => {
        const start = request.model.getPositionAt(span.start);
        const end = request.model.getPositionAt(span.end);
        return { range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
          options: { inlineClassName: classFor(span), inlineClassNameAffectsLetterSpacing: true } };
      }));
      hint.textContent = 'Theme highlighting ready · Ctrl/⌘ Z — undo';
    }
    request.resolve();
  });
  worker.addEventListener('error', event => {
    hint.textContent = 'Theme highlighting could not load. Reload the preview to retry.';
    for (const request of requests.values()) request.reject(new Error(event.message));
    requests.clear();
  });
  function repaint() {
    clearTimeout(timer);
    const model = editor.getModel();
    const id = ++nextId;
    hint.textContent = 'Updating theme highlighting…';
    return new Promise((resolve, reject) => {
      requests.set(id, { model, version: model.getVersionId(), resolve, reject });
      worker.postMessage({ id, source: model.getValue(), language });
    });
  }
  const contentListener = editor.onDidChangeModelContent(() => {
    clearTimeout(timer);
    timer = setTimeout(() => repaint().catch(console.error), 150);
  });
  let latest = repaint();
  return {
    ready: latest,
    setLanguage(name) {
      if (name === language) return latest;
      views.set(language, editor.saveViewState());
      decorations.clear();
      language = name;
      editor.setModel(modelFor(name));
      if (views.has(name)) editor.restoreViewState(views.get(name));
      return latest = repaint();
    },
    reset() { editor.setValue(samples[language]); },
    focus() { editor.layout(); editor.focus(); },
    layout() { editor.layout(); },
    dispose() {
      clearTimeout(timer); contentListener.dispose(); worker.terminate(); decorations.clear();
      styleSheet.remove(); editor.dispose(); for (const model of models.values()) model.dispose();
    },
  };
}
