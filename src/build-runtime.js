/**
 * @file Assemble a reproducible private runtime, parser payloads, and third-party notices.
 * Generated files are checked against these exact bytes by package validation.
 */

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { grammars } = require('./syntax/tree');
const palette = require('./colors');
const { themeVariants } = require('./theme-variants');
const root = path.resolve(__dirname, '..');
const runtimeDirectory = path.join(root, 'runtime');

/**
 * Collect owned runtime code, vendored parsers, grammar binaries, and licenses.
 * The manifest hashes every payload file so packaging can detect stale assets.
 *
 * @returns {Map<string, Buffer>} Runtime-relative paths and their exact distributable bytes.
 */
function runtimeFiles() {
  const files = new Map();
  /**
   * Read one owned source asset into the runtime payload map.
   * @type {(target: string, source: string) => Map<string, Buffer>}
   */
  const add = (target, source) => files.set(target, fs.readFileSync(path.join(root, source)));
  for (const name of fs.readdirSync(path.join(__dirname, 'syntax')).sort()) {
    if (name.endsWith('.js') || name.endsWith('.md')) add(name, `src/syntax/${name}`);
  }
  files.set('palette.json', Buffer.from(`${JSON.stringify(palette)}\n`));
  // Runtime gating consumes generated metadata instead of duplicating public
  // theme labels in the extension host bundle.
  files.set('theme-variants.json', Buffer.from(`${JSON.stringify(themeVariants)}\n`));
  add('vendor/typescript.js', 'node_modules/typescript/lib/typescript.js');
  add('licenses/typescript-LICENSE.txt', 'node_modules/typescript/LICENSE.txt');
  add('licenses/typescript-NOTICES.txt', 'node_modules/typescript/ThirdPartyNoticeText.txt');
  add('vendor/web-tree-sitter.cjs', 'node_modules/web-tree-sitter/web-tree-sitter.cjs');
  add('vendor/web-tree-sitter.wasm', 'node_modules/web-tree-sitter/web-tree-sitter.wasm');
  add('licenses/web-tree-sitter-LICENSE', 'node_modules/web-tree-sitter/LICENSE');
  add('licenses/tree-sitter-wasm-LICENSE', 'node_modules/tree-sitter-wasm/LICENSE');
  add('licenses/APACHE-2.0.txt', 'LICENSE');
  for (const grammar of Object.values(grammars).sort()) {
    add(`grammars/${grammar}.wasm`, `node_modules/tree-sitter-wasm/out/${grammar}/tree-sitter-${grammar}.wasm`);
  }
  const manifest = Object.fromEntries([...files].map(([name, bytes]) =>
    [name, createHash('sha256').update(bytes).digest('hex')]));
  files.set('manifest.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return files;
}

/**
 * Write only changed runtime assets, preserving mtimes for unchanged files.
 *
 * @returns {void} The runtime directory is created when needed.
 */
function buildRuntime() {
  for (const [name, bytes] of runtimeFiles()) {
    const target = path.join(runtimeDirectory, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) fs.writeFileSync(target, bytes);
  }
}

module.exports = { buildRuntime, runtimeFiles, runtimeDirectory };
