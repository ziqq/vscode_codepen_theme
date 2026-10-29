const { parentPort } = require('node:worker_threads');
const { refine } = require('./refine');

// Serialize lazy WASM initialization; only document text crosses the boundary.
let pending = Promise.resolve();
parentPort.on('message', (message) => {
  pending = pending.then(async () => {
    try {
      const spans = await refine(message.source, message.language);
      parentPort.postMessage({ id: message.id, spans });
    } catch (error) {
      parentPort.postMessage({ id: message.id, error: String(error.message) });
    }
  });
});
