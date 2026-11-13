/** @file Bundle the isolated browser-editor prototype; the release extension is unchanged. */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { rm } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const outdir = 'samples/site/editor-demo/build';
await rm(outdir, { recursive: true, force: true });
await build({
  entryPoints: {
    editor: 'samples/site/editor-demo/editor.js',
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
    name: 'patched-dompurify',
    setup(builder) {
      builder.onResolve({ filter: /dompurify\/dompurify\.js$/ }, () => ({
        path: require.resolve('dompurify'),
      }));
    },
  }],
  logLevel: 'info',
});
