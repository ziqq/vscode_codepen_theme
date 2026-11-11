/**
 * @file Exercise ownership, coalescing, stale replies, disposal, and Dart constant resolution.
 * Provider and worker doubles test lifecycle boundaries without mutating an editor profile.
 */

const assert = require('node:assert/strict');
const Module = require('node:module');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
/**
 * Yield asynchronously while waiting for an editor handshake or deterministic lifecycle boundary.
 * @type {(milliseconds: number) => Promise<void>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('theme gating, opt-out, coalescing, stale results, closure and disposal', async () => {
  const listeners = {};
  /**
   * Register deterministic lifecycle callbacks in the editor double.
   * @type {(name: string) => (callback: Function) => {dispose: () => void}}
   */
  const event = (name) => (callback) => { listeners[name] = callback; return { dispose() {} }; };
  const configuration = { theme: 'Default Dark Modern', enabled: true };
  const workers = [];
  class Worker extends EventEmitter {
    constructor() { super(); this.messages = []; workers.push(this); }
    postMessage(message) { this.messages.push(message); }
    terminate() { this.terminated = true; return Promise.resolve(); }
    reply(message, role = 'blue', fontStyle) {
      this.emit('message', { id: message.id,
        spans: [{ start: 0, end: 1, role, ...(fontStyle ? { fontStyle } : {}) }] });
    }
  }
  let text = 'const a = 1';
  const document = { uri: { toString: () => 'untitled:test.ts' }, languageId: 'typescript', version: 1,
    getText: () => text, positionAt: (offset) => offset, isClosed: false };
  const applied = new Map();
  const types = [];
  const editor = { document, setDecorations: (type, ranges) => applied.set(type, ranges) };
  const vscode = {
    ExtensionMode: { Development: 2 }, DecorationRangeBehavior: { ClosedClosed: 1 },
    Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
    window: { visibleTextEditors: [editor], onDidChangeVisibleTextEditors: event('visible'),
      createOutputChannel: () => ({ appendLine() {}, dispose() {} }),
      createTextEditorDecorationType: (options) => {
        const type = { options, dispose() { this.disposed = true; } }; types.push(type); return type;
      } },
    workspace: {
      getConfiguration: (section) => ({ get: () => section === 'workbench' ? configuration.theme : configuration.enabled }),
      onDidChangeConfiguration: event('configuration'), onDidChangeTextDocument: event('edit'),
      onDidCloseTextDocument: event('close'),
    },
  };
  const load = Module._load;
  let activate;
  try {
    Module._load = function (id, ...args) {
      if (id === 'vscode') return vscode;
      if (id === 'node:worker_threads') return { Worker };
      return load.call(this, id, ...args);
    };
    ({ activate } = require('../runtime/extension'));
  } finally { Module._load = load; }
  const context = { subscriptions: [] };
  const api = activate(context);
  /**
   * Deliver a configuration change to the extension double.
   * @type {() => void}
   */
  const changed = () => listeners.configuration({ affectsConfiguration: () => true });
  /**
   * Check that every registered decoration type has no remaining ranges.
   * @type {() => boolean}
   */
  const isClear = () => [...applied.values()].every((ranges) => ranges.length === 0);
  try {
    await wait(15);
    assert.equal(workers.length, 0, 'Inactive theme must not start a parser');
    configuration.theme = 'CodePen Theme Original'; changed(); await wait(15);
    assert.equal(workers.length, 1);
    workers[0].reply(workers[0].messages[0], 'blue', 'italic');
    assert.equal(isClear(), false);
    assert.equal(types.at(-1).options.fontStyle, undefined,
      'Original must suppress runtime-provided italics');
    assert.equal(api.getState().documents[0].version, 1);
    configuration.theme = 'CodePen Theme Original Italics'; changed(); await wait(15);
    assert.ok(workers[0].terminated);
    assert.equal(workers.length, 2, 'Italics must keep refinement active');
    workers[1].reply(workers[1].messages[0], 'blue', 'italic');
    assert.equal(types.at(-1).options.fontStyle, 'italic',
      'Italics must retain runtime-provided italics');
    const minorChange = [{ text: 'b', range: { start: { line: 0 }, end: { line: 0 } } }];
    document.version++; text = 'const b = 2'; listeners.edit({ document, contentChanges: minorChange }); await wait(100);
    assert.equal(isClear(), false, 'Minor edits keep decorations to avoid a flash to the semantic layer');
    const inFlight = workers[1].messages[1];
    for (let count = 0; count < 4; count++) {
      document.version++; text = `const c = ${count}`; listeners.edit({ document, contentChanges: minorChange }); await wait(90);
    }
    assert.equal(workers[1].messages.length, 2, 'Only one worker request may be in flight');
    assert.equal(api.getState().pending, 2, 'Keep one latest queued version per document');
    const typesBefore = types.length;
    workers[1].reply(inFlight, 'purple');
    assert.equal(types.length, typesBefore, 'Superseded parse must not be applied');
    assert.equal(workers[1].messages[2].source, text);
    workers[1].reply(workers[1].messages[2]);
    assert.equal(api.getState().documents[0].version, document.version);
    document.version++; text = 'const b = 2\nconst e = 4';
    listeners.edit({ document, contentChanges: [{ text: '\nconst e = 4', range: { start: { line: 0 }, end: { line: 1 } } }] });
    assert.equal(isClear(), false, 'Line moves and pastes keep decorations until the re-parse lands');
    configuration.enabled = false; changed(); await wait(15);
    assert.ok(workers[1].terminated);
    assert.equal(isClear(), true); assert.equal(api.getState().documents.length, 0);
    workers[1].reply(inFlight, 'purple'); assert.equal(isClear(), true);
    configuration.enabled = true; changed(); await wait(15);
    configuration.theme = 'Default Dark Modern'; changed(); await wait(15);
    workers[2].reply(workers[2].messages[0]); assert.equal(isClear(), true);
    assert.equal(api.getState().pending, 0);
    configuration.theme = 'CodePen Theme Original'; changed(); await wait(15);
    document.isClosed = true; listeners.close(document);
    workers[3].reply(workers[3].messages[0]); assert.equal(api.getState().documents.length, 0);
    document.isClosed = false; document.version++; text = 'x'.repeat(250001);
    listeners.edit({ document, contentChanges: minorChange }); await wait(100);
    assert.equal(api.getState().pending, 0, 'Oversize files retain provider highlighting');
  } finally { for (const subscription of context.subscriptions) subscription.dispose(); }
  assert.ok(types.every((type) => type.disposed));
  assert.ok(workers.every((worker) => worker.terminated));
});

test('imported Dart constants use their declarations; static-final fields retain purple', async () => {
  const { dartConstantsAt } = require('../runtime/tree');
  const source = 'Service.limit + Service.cached';
  const targetSource = 'class Service { static\n const int limit = 1; static final int cached = 2; }';
  const targetUri = { toString: () => 'file:///service.dart' };
  const document = { uri: { toString: () => 'file:///main.dart' }, getText: () => source,
    positionAt: (offset) => ({ line: 0, character: offset }), offsetAt: (position) => position.character };
  const target = { version: 1, getText: () => targetSource, offsetAt: (position) => position.character };
  let available = true;
  const vscode = {
    Position: class { constructor(line, character) { Object.assign(this, { line, character }); } },
    Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
    extensions: { getExtension: () => ({ activate: async () => {} }) },
    workspace: { openTextDocument: async () => target },
    commands: { executeCommand: async (command, _uri, position) => {
      if (command.endsWith('Legend')) return { tokenTypes: ['property'], tokenModifiers: ['static'] };
      if (command.endsWith('SemanticTokens')) return { data: [0, 8, 5, 0, 1, 0, 16, 6, 0, 1] };
      assert.equal(command, 'vscode.executeDefinitionProvider');
      const name = source.slice(position.character).split(/\W/)[0];
      return [{ uri: targetUri, range: { start: { character: targetSource.indexOf(name) } } }];
    } },
  };
  const load = Module._load;
  let resolveDartConstants;
  try {
    delete require.cache[require.resolve('../runtime/dart-constants')];
    Module._load = function (id, ...args) {
      return id === 'vscode' ? vscode : load.call(this, id, ...args);
    };
    ({ resolveDartConstants } = require('../runtime/dart-constants'));
  } finally { Module._load = load; }
  const spans = [
    { start: 8, end: 13, role: 'purple' },
    { start: 24, end: 30, role: 'purple' },
  ];
  assert.deepEqual(await resolveDartConstants(document, spans, dartConstantsAt, () => available), [
    { start: 8, end: 13, role: 'blue' },
    { start: 24, end: 30, role: 'purple' },
  ]);
  let parsed = false;
  const result = await resolveDartConstants(document, spans, async (...args) => {
    parsed = true;
    available = false;
    return dartConstantsAt(...args);
  }, () => available);
  assert.ok(parsed);
  assert.equal(available, false, 'The caller must discard resolution after its document changes');
  assert.deepEqual(result, spans, 'A superseded resolution must not return recolored spans');
});
