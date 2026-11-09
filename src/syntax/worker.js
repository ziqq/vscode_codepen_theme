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
