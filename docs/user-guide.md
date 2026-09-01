# User guide

## Installing

Install [CodePen Theme Original](https://marketplace.visualstudio.com/items?itemName=ziqq.codepen-theme-original) from the Visual Studio Code Marketplace, then select **CodePen Theme Original** from **Preferences: Color Theme**. It does not add italics. Select **CodePen Theme Original Ligatures** for the same palette with the theme's italic syntax styling. Version `1.0.0` requires Visual Studio Code `1.96.0` or newer. Provider version bands preserve the full supported syntax set on older compatible VS Code releases.

The extension contributes the legacy ligature stack—`Operator Mono Lig`,
`Operator Mono`, `Monaco`, Courier, then `monospace`—for the editor, Debug
Console, and integrated terminal. Editor ligatures are enabled.
VS Code exposes Output as a Log-language editor, so its typography is contributed
through the `[Log]` language override rather than nonexistent `output.font*`
settings. Existing explicit user settings take precedence. These defaults apply
while the extension is installed because VS Code cannot scope font settings to a
selected color theme. The Original theme removes theme-owned italics; the
Ligatures theme retains them. If Operator Mono is unavailable, VS Code uses the
next installed font in the stack. Terminal ligatures remain user-controlled so
the extension stays compatible with both sides of VS Code 1.97's terminal setting rename.

## Language support

CodePen Theme does not register languages or TextMate grammars. Syntax scopes come
from Visual Studio Code or an installed language extension. A theme-scoped syntax
refinement layer resolves ambiguous contexts that those scopes and semantic tokens
cannot distinguish. It does not replace the installed language providers.

Visual Studio Code already provides syntax grammars for common languages such as HTML, CSS, SCSS, JavaScript, TypeScript, JSON, Markdown, Dart, Go, Python, Rust, and SQL. Install the relevant language extension for formats that are not built in.

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

Provider contracts were verified with VS Code `1.135.0` on 2026-09-01. Version bands are compatibility baselines, not installation pins.
CI integration matrix: `1.96.0`, `1.105.1`, `1.134.0`, `1.135.0`.
<!-- provider-table:end -->

These extensions are recommendations documented in this guide, not dependencies. CodePen Theme does not install them automatically. You can use another language extension, but its TextMate scopes may produce different colors.

The compatibility contract is stored in [`compatibility/scopes.json`](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/scopes.json). It connects every sample to a provider version, language ID, root grammar scope, and representative TextMate scopes. Broad provider-agnostic mappings provide stable defaults, while more specific existing mappings preserve the original CodePen palette.

## Twilight colors and semantic highlighting

The palette follows the classic CodePen Twilight editor: green strings, orange
numbers, yellow keywords and global references, blue bindings and local variables,
white type references, purple members, brown HTML/JSX tags, muted comments, and
`#CCCCCC` operators. Existing italic, bold,
and underline TextMate rules are preserved separately from colors.

Semantic highlighting is enabled when `editor.semanticHighlighting.enabled` is
`configuredByTheme` (the VS Code default). Semantic colors are separate from
typography in the source; a small Dart keyword style layer preserves italics
when the provider replaces TextMate styling. JS/TS uses the built-in provider's `local`, `declaration`, and
`defaultLibrary` modifiers to distinguish local symbols, declarations, and
library functions. Properties and methods remain purple, including declarations. Setting semantic
highlighting to `false` keeps the TextMate fallback available. Contextual refinement
works in both modes; disable `codepen.syntaxRefinement.enabled` as well for a strictly
TextMate-only comparison.

Other languages use the same standard semantic roles when their language extension
supplies them. The refinement layer uses bundled parsers for local syntax and binding
context, not a project language server. No imports or project code are executed.
It cannot resolve every cross-file or language-server-specific symbol.

Refinement is active with both **CodePen Theme Original** variants. Switching themes or
disabling `codepen.syntaxRefinement.enabled` removes its decorations and stops its
worker. **CodePen Theme Original** suppresses theme-owned italics while retaining
bold and underline. **CodePen Theme Original Ligatures** retains the italic layer,
with narrow corrections for Dart documentation and `Function` types. To use custom
semantic/TextMate foreground overrides instead,
disable refinement. Files larger than 250,000 UTF-16 code units, unsupported contexts,
and parser failures retain the ordinary provider highlighting. Desktop and remote
Node extension hosts are supported; browser-only VS Code uses the color theme without
the Node refinement runtime. See [the refinement contract](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/REFINEMENT.md).

The [Twilight audit](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/TWILIGHT.md) records 30 live CodePen JS/TS/JSX
experiments, measured token colors, cross-language mappings, and known parser
and provider differences. [`compatibility/twilight.json`](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/twilight.json) records color expectations
for all supported language fixtures; other languages are role-based adaptations,
not claims that CodePen supports those languages. Bracket-pair rainbow foregrounds
are transparent so they do not override syntax colors. Unmeasured
selection/search/error states and VS Code-specific workbench/terminal colors
retain the existing theme values rather than claiming an exact CodePen match.
With contextual refinement active, all 1,885 recorded nonblank JS/TS/JSX spans
match the live classic Twilight capture exactly; author italics remain unchanged.

The [full-language audit](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/LANGUAGE-AUDIT.md) covers all 68 complete
samples and records fixes and remaining provider limitations per language.
Just/Make recipe targets are purple; their variables and parameters are blue.
Java modifiers are yellow, type references white, and members purple. Dart
annotations use the same yellow role with and without semantic highlighting.
The exact list of verified languages and grammars that still use generic fallback
coverage is maintained in the [syntax coverage boundary](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/COVERAGE.md).

## Migration from 0.12.x

Version `1.0.0` intentionally removes the old registered language definitions and
TextMate grammars. Before upgrading, install the language extensions you need
from the table above. The new private WASM parsers only refine colors; they do not
restore the removed language registrations.

The following behavior changes are expected:

- `.c4` files are no longer registered by CodePen Theme. The recommended C4 extension targets Structurizr `.dsl` files.
- Kotlin script support depends on the installed Kotlin extension and the file types it registers.
- Language detection, brackets, comments, formatting, validation, and syntax scopes are owned by the installed language extension.
- Without a provider for a non-built-in language, Visual Studio Code may open the file as plain text.

Use **Developer: Inspect Editor Tokens and Scopes** when reporting a syntax color mismatch. Include the language extension name and the inspected TextMate scopes.
