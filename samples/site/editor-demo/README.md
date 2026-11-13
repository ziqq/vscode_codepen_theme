# Editable hero prototypes

This branch contains two layouts for the same lazy-loaded Monaco editor:

- **A — inline:** edit the code in the right-hand hero panel.
- **B — dialog:** retain the screenshot and edit in a larger dialog.

The TypeScript, Dart and Rust examples are imported from `samples/fixtures/`.
Each language has its own model, preserving edits and undo history while switching.
Reset restores only the current example. Edits are held in memory for this tab;
there is no code execution, backend or persistence across reloads.

The preview uses the generated Original theme, VS Code 1.135 TextMate grammars,
Oniguruma and the extension's shared TypeScript/Dart/Rust refiners. Monaco supplies
editing only; its own tokenizers and bracket colors do not assign syntax colors.
Parsing runs in a separate worker. Version/model checks discard stale replies.
VS Code project language servers and cross-file analysis are not included.

From the repository root:

```sh
npm ci
npm run build:editor-demo
python3 -m http.server 18776 --bind 127.0.0.1 --directory samples/site
```

Open <http://127.0.0.1:18776/editor-demo/>. The generated `build/` directory is
ignored by Git; rebuild it after changing the adapter or fixture sources. The
regular landing and release extension do not import the demo.
The editor worker and theme worker are bundled separately. The theme worker
uses the same TypeScript compiler and Dart/Rust Tree-sitter parsers as the extension;
TypeScript language-service workers are not included. Browser adapters only replace
Node asset paths and in-memory compiler dependencies, leaving classifier code unchanged.

Monaco 0.57.0 embeds DOMPurify 3.4.15 in addition to its npm dependency. The
scoped override and build resolver both select the patched DOMPurify 3.4.17;
changing only the lockfile would leave the embedded vulnerable copy in the bundle.
