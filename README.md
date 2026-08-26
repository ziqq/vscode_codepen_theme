# VS Code CodePen Theme

A dark Visual Studio Code color theme inspired by the CodePen editor. Made with 🖤 by ziqq.

## Installing

Install [CodePen Theme Original](https://marketplace.visualstudio.com/items?itemName=ziqq.codepen-theme-original) from the Visual Studio Code Marketplace, then select **CodePen Theme Original** from **Preferences: Color Theme**. Version `1.0.0` requires Visual Studio Code `1.96.0` or newer. Provider version bands preserve the full supported syntax set on older compatible VS Code releases.

## Language support

Starting with `1.0.0`, CodePen Theme is a pure color theme. It contributes no languages or TextMate grammars. Syntax scopes come from Visual Studio Code or an installed language extension, and CodePen Theme assigns colors to those scopes.

Visual Studio Code already provides syntax grammars for common languages such as HTML, CSS, SCSS, JavaScript, TypeScript, JSON, Markdown, Dart, Go, Python, Rust, SQL, and dotenv. Install the relevant language extension for formats that are not built in.

### Recommended language extensions

<!-- provider-table:start -->
| Language or format | Extension | Compatible provider versions |
| --- | --- | --- |
| C4 / Structurizr DSL | [C4 DSL Extension](https://marketplace.visualstudio.com/items?itemName=systemticks.c4-dsl-extension) | `3.7.1` for `>=1.96.0` |
| dotenv | [Dotenv Official +Vault](https://marketplace.visualstudio.com/items?itemName=dotenv.dotenv-vscode) | `0.28.1` for `>=1.96.0` |
| Go modules | [Go](https://marketplace.visualstudio.com/items?itemName=golang.go) | `0.57.2` for `>=1.96.0` |
| Kotlin | [Kotlin by JetBrains](https://marketplace.visualstudio.com/items?itemName=JetBrains.kotlin-server) | `0.0.1` for `>=1.96.0 <1.105.1`<br>`0.0.8` for `>=1.105.1` |
| Just | [vscode-just](https://marketplace.visualstudio.com/items?itemName=nefrob.vscode-just-syntax) | `0.10.2` for `>=1.96.0` |
| Sass | [Sass (.sass only)](https://marketplace.visualstudio.com/items?itemName=Syler.sass-indented) | `1.8.33` for `>=1.96.0` |
| Svelte | [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | `110.3.1` for `>=1.96.0` |
| TOML | [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) | `0.21.2` for `>=1.96.0` |
| Vue | [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | `3.3.11` for `>=1.96.0` |

Provider contracts were verified with VS Code `1.134.0` on 2026-08-25. Version bands are compatibility baselines, not installation pins.
CI integration matrix: `1.96.0`, `1.105.1`, `1.134.0`.
<!-- provider-table:end -->

These extensions are recommendations documented in this README, not dependencies. CodePen Theme does not install them automatically. You can use another language extension, but its TextMate scopes may produce different colors.

The compatibility contract is stored in `compatibility/scopes.json`. It connects every sample to a provider version, language ID, root grammar scope, and representative TextMate scopes. Broad provider-agnostic mappings provide stable defaults, while more specific existing mappings preserve the original CodePen palette.

## Migration from 0.12.x

Version `1.0.0` intentionally removes all bundled language definitions and grammars. Before upgrading, install the language extensions you need from the table above.

The following behavior changes are expected:

- `.c4` files are no longer registered by CodePen Theme. The recommended C4 extension targets Structurizr `.dsl` files.
- Kotlin script support depends on the installed Kotlin extension and the file types it registers.
- Language detection, brackets, comments, formatting, validation, and syntax scopes are owned by the installed language extension.
- Without a provider for a non-built-in language, Visual Studio Code may open the file as plain text.

Use **Developer: Inspect Editor Tokens and Scopes** when reporting a syntax color mismatch. Include the language extension name and the inspected TextMate scopes.

## Development

The theme follows the same source-to-generated architecture as GitHub Theme:

```text
src/colors.js -> src/theme.js -> src/index.js -> themes/codepen-theme.json
```

- Edit the palette in `src/colors.js`.
- Edit workbench colors and TextMate scope mappings in `src/theme.js`.
- Run `npm run build` to regenerate `themes/codepen-theme.json`.
- Run `npm run check` to verify the manifest, recommendations, and generated output.
- Run `npm run check:compatibility` to verify provider scopes against the theme.
- Run `npm run docs:update` after changing provider metadata or version bands.
- Open files under `samples/` to inspect scopes from built-in and recommended language providers.
- Use the **Run Samples** launch configuration for a deterministic TextMate-only review.
- Run `npm run visual:update` only after accepting an intentional visual change.
- Run `npm run package` to build and validate the distributable VSIX.
- Press `F5` to build the theme and open an Extension Development Host.

Do not edit `themes/codepen-theme.json` directly. It is a generated and minified Marketplace artifact and must be committed together with its source changes. Development sources, compatibility fixtures, and samples are excluded from the VSIX. Preview screenshots are local WebP files rendered at their stored 888 px width; the extension icon remains PNG as required by Marketplace packaging.

The scheduled `Provider Compatibility` workflow is the heavy integration layer. On an isolated GitHub runner it installs the VSIX across the generated compatibility matrix; tokenizes every sample with the exact built-in or recommended provider grammar; captures real VS Code screenshots for representative built-in and external languages; and checks Marketplace metadata for provider drift. Its JSON reports and PNG screenshots are uploaded as workflow artifacts.

These integration scripts do not download VS Code or provider packages during ordinary local checks. Local execution requires an existing editor through `CODEPEN_VSCODE_EXECUTABLE` and already cached providers. A download outside CI is possible only through the explicit `CODEPEN_ALLOW_VSCODE_DOWNLOAD=1` or `CODEPEN_ALLOW_PROVIDER_DOWNLOAD=1` opt-in.

## Screenshots

#### HTML
<img src="./assets/preview_html.webp" width="888">

#### SCSS
<img src="./assets/preview_scss.webp" width="888">

#### SASS
<img src="./assets/preview_sass.webp" width="888">

#### JS
<img src="./assets/preview_js.webp" width="888">

#### DART
<img src="./assets/preview_dart_I.webp" width="888">
<img src="./assets/preview_dart_II.webp" width="888">

#### GO
<img src="./assets/preview_go.webp" width="888">

#### PYTHON
<img src="./assets/preview_python.webp" width="888">

#### RUST
<img src="./assets/preview_rust_I.webp" width="888">
<img src="./assets/preview_rust_II.webp" width="888">

#### TOML
<img src="./assets/preview_toml.webp" width="888">

#### JAVA
<img src="./assets/preview_java.webp" width="888">

#### JUSTFILE
<img src="./assets/preview_justfile.webp" width="888">

#### SQL
<img src="./assets/preview_sql.webp" width="888">

#### ENV
<img src="./assets/preview_env.webp" width="888">
