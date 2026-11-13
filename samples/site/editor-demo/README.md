# Editable hero prototypes

This branch contains two layouts for the same lazy-loaded Monaco editor:

- **A — inline:** edit the code in the right-hand hero panel.
- **B — dialog:** retain the screenshot and edit in a larger dialog.

The TypeScript, Dart and Rust examples are imported from `samples/fixtures/`.
Each language has its own model, preserving edits and undo history while switching.
Reset restores only the current example. Edits are held in memory for this tab;
there is no code execution, backend or persistence across reloads.

The browser tokenizers use the shared CodePen palette. This is a layout/editing
prototype, not proof of VS Code color parity: the extension's contextual
refinement and language-server semantic tokens are not included.

From the repository root:

```sh
npm ci
npm run build:editor-demo
python3 -m http.server 18776 --bind 127.0.0.1 --directory samples/site
```

Open <http://127.0.0.1:18776/editor-demo/>. The generated `build/` directory is
ignored by Git; rebuild it after changing the adapter or fixture sources. The
regular landing and release extension do not import the demo. Only Monaco's
editor worker and three basic tokenizers are bundled; TypeScript language-service
workers are deliberately excluded.

Monaco 0.57.0 embeds DOMPurify 3.4.15 in addition to its npm dependency. The
scoped override and build resolver both select the patched DOMPurify 3.4.17;
changing only the lockfile would leave the embedded vulnerable copy in the bundle.
