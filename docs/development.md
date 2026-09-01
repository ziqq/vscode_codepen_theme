# Development guide

The theme follows the same source-to-generated architecture as GitHub Theme:

```text
src/colors.js ------> src/theme.js ----------> themes/*.json
src/theme-variants.js -> src/index.js --------> runtime/theme-variants.json
package.json -------------------------------> VS Code typography defaults
                      \\----------------------> validation/editor harness
```

## Daily workflow

- Edit the palette in `src/colors.js`, TextMate and workbench mappings in `src/theme.js`, and public variant metadata in `src/theme-variants.js`.
- Edit classic typography only in `package.json`; validation and the editor harness read `contributes.configurationDefaults` directly from the manifest.
- Run `npm run build` to regenerate `themes/` and the ignored `runtime/` bundle.
- Run `npm run check` before submitting a change. Use `npm run check:compatibility`, `npm run check:colors`, and `npm run test:refinement` for focused diagnosis.
- Run `npm run test:providers -- <version>` for real-grammar colors, `npm run test:semantic -- <version>` for bundled JS/TS classifications, and `npm run test:reference -- <version>` to compare the recorded CodePen corpus with real JS/TS/JSX grammars.
- Run `npm run docs:update` after changing provider metadata or VS Code version bands, and `npm run visual:update` only after accepting an intentional visual change.
- Run `npm run package` to build and validate the distributable VSIX.

Do not edit files under `themes/` directly. They are generated and minified Marketplace artifacts, and must be committed with their source changes. Development sources, compatibility fixtures, and samples are excluded from the VSIX.

## Local preview

Press `F5` to build the theme, start its source watcher, and open an isolated Extension Development Host. The sample launcher loads this checkout, not a Marketplace copy. It uses VS Code's `--profile-temp`, so normal settings and extensions are not affected. Do not replace it with `--user-data-dir` or `--extensions-dir`: those arguments do not isolate the parent VS Code process.

Use the **Run Samples** launch configuration to inspect built-in and recommended language providers with semantic highlighting. Temporarily disable `editor.semanticHighlighting.enabled` in the sample workspace to compare the TextMate fallback, then restore `configuredByTheme`. The generated sample workspace and provider links live under `.cache/codepen-theme/preview/`; its `manifest.json` records resolved source paths and versions.

The `npm run start` background task rebuilds after edits to `src/` and can be reused across debugging sessions. Stop it with **Tasks: Terminate Task** when finished. **Run Samples Without Build** uses the same isolated setup without building or starting a watcher; use it only with an already current generated theme. Palette changes reload refinement decorations in development mode. After editing runtime logic, reload the Extension Development Host to load changed JavaScript.

The launcher loads providers selected by [`compatibility/scopes.json`](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/scopes.json) from local caches and the locally installed Dart-Code extension through development-path links. Missing providers stop preparation with an actionable error. For a nonstandard Dart installation, set `CODEPEN_DART_EXTENSION` and, if necessary, `CODEPEN_DART_SDK`. Other languages' semantic tokens still depend on their language servers and SDKs.

Preview settings neutralize the token-color override written by the dotenv provider. If VS Code opens the sample workspace in Restricted Mode, confirm trust before checking semantic highlighting; the launcher does not disable Workspace Trust.

## Compatibility checks

The scheduled `Provider Compatibility` workflow installs the VSIX across the generated compatibility matrix; tokenizes every sample with the exact built-in or recommended grammar; captures real VS Code screenshots; and checks Marketplace metadata for provider drift. Its reports and screenshots are uploaded as workflow artifacts.

The matrix checks final source-span colors, not only scope presence, and runs the bundled TypeScript language service against JS/TS semantic fixtures. It does not prove activation of every third-party language server. Optional local Dart semantic verification requires an installed Dart-Code extension and SDK; see the [audit commands](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/TWILIGHT.md#verification).

Screenshot smoke tests cover both TextMate-only and JS/TS semantic modes, retain bracket-pair colorization, and check exact rendered TSX spans.

Ordinary local checks do not download VS Code or providers. They require `CODEPEN_VSCODE_EXECUTABLE` and cached providers. Downloads outside CI require explicit `CODEPEN_ALLOW_VSCODE_DOWNLOAD=1` or `CODEPEN_ALLOW_PROVIDER_DOWNLOAD=1` opt-in.
