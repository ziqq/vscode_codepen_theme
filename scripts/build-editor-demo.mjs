/** @file Bundle the isolated browser-editor prototype; the release extension is unchanged. */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { rm, readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const outdir = 'samples/site/editor-demo/build';
await rm(outdir, { recursive: true, force: true });
await build({
  entryPoints: {
    editor: 'samples/site/editor-demo/editor.js',
    'theme.worker': 'samples/site/editor-demo/theme.worker.js',
    'editor.worker': 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
  },
  outdir,
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: 'es2022',
  loader: { '.tsx': 'text', '.dart': 'text', '.rs': 'text', '.ttf': 'file' },
  // Monaco also embeds DOMPurify 3.4.15. Replace that copy, not just npm's dependency.
  plugins: [{
    name: 'shared-refiners-browser-adapter',
    setup(builder) {
      builder.onResolve({ filter: /vendor\/typescript\.js$/ }, () => ({ path: require.resolve('typescript') }));
      builder.onResolve({ filter: /vendor\/web-tree-sitter\.cjs$/ }, () => ({ path: require.resolve('web-tree-sitter') }));
      builder.onLoad({ filter: /src\/syntax\/tree\.js$/ }, async args => {
        const source = await readFile(args.path, 'utf8');
        return { contents: source
          .replace("const path = require('node:path');", '')
          .replace('module.exports = { refineTree, withTree, grammars, dartConstantsAt };', 'export { refineTree, withTree, grammars, dartConstantsAt };')
          .replace("path.join(__dirname, 'vendor/web-tree-sitter.wasm')", "new URL('./web-tree-sitter.wasm', import.meta.url).href")
          .replace("path.join(__dirname, `grammars/${grammar}.wasm`)", "new URL(`./grammars/${grammar}.wasm`, import.meta.url).href"),
          loader: 'js', resolveDir: path.dirname(args.path) };
      });
      // The compiler/refiner uses an in-memory host; Node-only branches are unreachable.
      builder.onResolve({ filter: /^(?:node:)?(?:fs|path|os|crypto|buffer|perf_hooks|inspector)$/ }, args => ({ path: args.path, namespace: 'browser-node-stub' }));
      builder.onLoad({ filter: /.*/, namespace: 'browser-node-stub' }, () => ({ contents: 'module.exports = {};', loader: 'js' }));
    },
  }, {
    name: 'patched-dompurify',
    setup(builder) {
      builder.onResolve({ filter: /dompurify\/dompurify\.js$/ }, () => ({
        path: require.resolve('dompurify'),
      }));
    },
  }],
  logLevel: 'info',
});

await mkdir(`${outdir}/grammars`, { recursive: true });
await copyFile('node_modules/vscode-oniguruma/release/onig.wasm', `${outdir}/onig.wasm`);
await copyFile('node_modules/web-tree-sitter/web-tree-sitter.wasm', `${outdir}/web-tree-sitter.wasm`);
for (const language of ['dart', 'rust']) {
  await copyFile(`node_modules/tree-sitter-wasm/out/${language}/tree-sitter-${language}.wasm`, `${outdir}/grammars/${language}.wasm`);
}

// Preserve the notices for parser/compiler assets served by the prototype.
await mkdir(`${outdir}/licenses`, { recursive: true });
for (const [name, source] of Object.entries({
  'vscode-grammars-LICENSE.txt': 'samples/site/editor-demo/grammars/LICENSE.txt',
  'vscode-textmate-LICENSE.md': 'node_modules/vscode-textmate/LICENSE.md',
  'vscode-oniguruma-LICENSE.txt': 'node_modules/vscode-oniguruma/LICENSE.txt',
  'vscode-oniguruma-NOTICES.txt': 'node_modules/vscode-oniguruma/NOTICES.txt',
  'web-tree-sitter-LICENSE.txt': 'node_modules/web-tree-sitter/LICENSE',
  'typescript-LICENSE.txt': 'node_modules/typescript/LICENSE.txt',
  'parser-NOTICES.md': 'src/syntax/THIRD-PARTY-NOTICES.md',
  'theme-LICENSE.txt': 'LICENSE',
})) await copyFile(source, `${outdir}/licenses/${name}`);
