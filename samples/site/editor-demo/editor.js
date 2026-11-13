/** @file Lazy Monaco adapter for three editable preview models. No language server is loaded. */
import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/languages/definitions/typescript/register.js';
import 'monaco-editor/languages/definitions/dart/register.js';
import 'monaco-editor/languages/definitions/rust/register.js';
import palette from '../../../src/colors.js';
import typescript from '../../fixtures/javascript/index.tsx';
import dart from '../../fixtures/dart/main.dart';
import rust from '../../fixtures/rust/main.rs';

// The browser editor uses its own worker, never the VS Code extension host.
globalThis.MonacoEnvironment = {
  getWorker: () => new Worker(new URL('./editor.worker.js', import.meta.url), { type: 'module' }),
};
const hex = (name) => palette[name].slice(1);
monaco.editor.defineTheme('codepen-preview', {
  base: 'vs-dark', inherit: true,
  rules: [
    { token: '', foreground: hex('white') },
    { token: 'identifier', foreground: hex('blue') },
    { token: 'type.identifier', foreground: hex('blue') },
    { token: 'keyword', foreground: hex('yellow') },
    { token: 'keyword.operator', foreground: hex('white') },
    { token: 'number', foreground: hex('orange') },
    { token: 'string', foreground: hex('green') },
    { token: 'comment', foreground: hex('gray'), fontStyle: 'italic' },
    { token: 'delimiter', foreground: hex('white') },
    { token: 'tag', foreground: hex('yellow') },
    { token: 'attribute.name', foreground: hex('purple') },
  ],
  colors: {
    'editor.background': palette.background, 'editor.foreground': palette.white,
    'editorLineNumber.foreground': '#4C4F5A', 'editorLineNumber.activeForeground': '#A5A7B2',
    'editor.selectionBackground': '#26415A', 'editor.inactiveSelectionBackground': '#2E2F39',
    'editorCursor.foreground': palette.yellow, 'editor.lineHighlightBackground': '#24252B',
    'editorWidget.background': '#1D1E22', 'editorWidget.border': '#34363E',
  },
});
const samples = { typescript, dart, rust };

/** Create one editor; separate models retain each language's edits and undo history. */
export function createPreview(container) {
  const models = new Map();
  const views = new Map();
  let language = 'typescript';
  const modelFor = (name) => {
    if (!models.has(name)) models.set(name, monaco.editor.createModel(samples[name], name));
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
    quickSuggestions: false, suggestOnTriggerCharacters: false, wordBasedSuggestions: 'off',
    accessibilitySupport: 'auto', ariaLabel: 'Editable CodePen theme code example',
    tabIndex: 0, tabSize: 2, insertSpaces: true,
  });
  return {
    setLanguage(name) {
      views.set(language, editor.saveViewState());
      language = name;
      editor.setModel(modelFor(name));
      if (views.has(name)) editor.restoreViewState(views.get(name));
    },
    reset() { editor.setValue(samples[language]); },
    focus() { editor.layout(); editor.focus(); },
    layout() { editor.layout(); },
    dispose() { editor.dispose(); for (const model of models.values()) model.dispose(); },
  };
}
