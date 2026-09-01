const assert = require('node:assert/strict');
const Module = require('node:module');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('theme gating, opt-out, coalescing, stale results, closure and disposal', async () => {
  const listeners = {};
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
  const changed = () => listeners.configuration({ affectsConfiguration: () => true });
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
    configuration.theme = 'CodePen Theme Original Ligatures'; changed(); await wait(15);
    assert.ok(workers[0].terminated);
    assert.equal(workers.length, 2, 'Ligatures must keep refinement active');
    workers[1].reply(workers[1].messages[0], 'blue', 'italic');
    assert.equal(types.at(-1).options.fontStyle, 'italic',
      'Ligatures must retain runtime-provided italics');
    document.version++; text = 'const b = 2'; listeners.edit({ document }); await wait(100);
    assert.equal(isClear(), true, 'Old ranges must be removed before new offsets are parsed');
    const inFlight = workers[1].messages[1];
    for (let count = 0; count < 4; count++) {
      document.version++; text = `const c = ${count}`; listeners.edit({ document }); await wait(90);
    }
    assert.equal(workers[1].messages.length, 2, 'Only one worker request may be in flight');
    assert.equal(api.getState().pending, 2, 'Keep one latest queued version per document');
    workers[1].reply(inFlight, 'purple');
    assert.equal(isClear(), true, 'Superseded parse must not be applied');
    assert.equal(workers[1].messages[2].source, text);
    workers[1].reply(workers[1].messages[2]);
    assert.equal(api.getState().documents[0].version, document.version);
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
    listeners.edit({ document }); await wait(100);
    assert.equal(api.getState().pending, 0, 'Oversize files retain provider highlighting');
  } finally { for (const subscription of context.subscriptions) subscription.dispose(); }
  assert.ok(types.every((type) => type.disposed));
  assert.ok(workers.every((worker) => worker.terminated));
});
