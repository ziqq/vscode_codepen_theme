# Language support

CodePen Theme does not register languages or TextMate grammars. Syntax scopes come
from Visual Studio Code or an installed language extension. A theme-scoped syntax
refinement layer resolves ambiguous contexts that those scopes and semantic tokens
cannot distinguish. It does not replace the installed language providers.

Visual Studio Code already provides syntax grammars for common languages such as
HTML, CSS, SCSS, JavaScript, TypeScript, JSON, Markdown, Dart, Go, Python, Rust,
and SQL. Install the relevant language extension for formats that are not built in.

## Recommended language extensions

<!-- provider-table:start -->
| Language or format | Extension | Compatible provider versions |
| --- | --- | --- |
| C4 / Structurizr DSL | [C4 DSL Extension](https://marketplace.visualstudio.com/items?itemName=systemticks.c4-dsl-extension) | `3.7.1` for `>=1.96.0` |
| dotenv | [Dotenv Official +Vault](https://marketplace.visualstudio.com/items?itemName=dotenv.dotenv-vscode) | `0.28.1` for `>=1.96.0` |
| Go modules | [Go](https://marketplace.visualstudio.com/items?itemName=golang.go) | `0.57.2` for `>=1.96.0` |
| Kotlin | [Kotlin by JetBrains](https://marketplace.visualstudio.com/items?itemName=JetBrains.kotlin-server) | `0.0.1` for `>=1.96.0 <1.105.1`<br>`0.0.11` for `>=1.105.1` |
| Just | [vscode-just](https://marketplace.visualstudio.com/items?itemName=nefrob.vscode-just-syntax) | `0.10.2` for `>=1.96.0` |
| Sass | [Sass (.sass only)](https://marketplace.visualstudio.com/items?itemName=Syler.sass-indented) | `1.8.33` for `>=1.96.0` |
| Svelte | [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | `110.3.1` for `>=1.96.0` |
| TOML | [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) | `0.21.2` for `>=1.96.0` |
| Vue | [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | `3.3.11` for `>=1.96.0` |

Provider contracts were verified with VS Code `1.135.0` on 2026-09-01. Version bands are compatibility baselines, not installation pins.
CI integration matrix: `1.96.0`, `1.105.1`, `1.134.0`, `1.135.0`.
<!-- provider-table:end -->

These extensions are recommendations, not dependencies. CodePen Theme does not
install them automatically. You can use another language extension, but its
TextMate scopes may produce different colors.

The compatibility contract is stored in
[`compatibility/scopes.json`](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/scopes.json).
It connects every sample to a provider version, language ID, root grammar scope,
and representative TextMate scopes. Broad provider-agnostic mappings provide
stable defaults, while more specific existing mappings preserve the original
CodePen palette.

See [Migration from 0.12.x](../MIGRATION.md) before upgrading from a release that
bundled language definitions and TextMate grammars.
