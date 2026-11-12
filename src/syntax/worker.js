/**
 * @file Serialize parser jobs and return plain transferable evidence to the extension host.
 * Keeping WASM initialization and parsing here avoids blocking the editor thread.
 */

/**
 * @typedef {{id: number, source: string, language: string}} ParseRequest
 * Foreground classification request; no filesystem or editor object crosses the boundary.
 */

/**
 * @typedef {{id: number, source: string, constantOffsets: number[]}} ConstantRequest
 * Inspection of already resolved Dart definition-name offsets.
 */

/**
 * @typedef {{id: number, spans?: import('./spans').Span[], constants?: boolean[], error?: string}} WorkerReply
 * Plain response matched by request ID; errors preserve provider highlighting.
 */

const { parentPort } = require('node:worker_threads');
const { refine } = require('./refine');
const { dartConstantsAt } = require('./tree');

// Serialize lazy WASM initialization; only document text crosses the boundary.
let pending = Promise.resolve();
parentPort.on('message', (message) => {
  pending = pending.then(async () => {
    try {
      if (message.constantOffsets) {
        const constants = await dartConstantsAt(message.source, message.constantOffsets);
        parentPort.postMessage({ id: message.id, constants });
        return;
      }
      const spans = await refine(message.source, message.language);
      parentPort.postMessage({ id: message.id, spans });
    } catch (error) {
      parentPort.postMessage({ id: message.id, error: String(error.message) });
    }
  });
});
