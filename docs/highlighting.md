# Highlighting

## Twilight colors

The palette follows the classic CodePen Twilight editor: green strings, orange
numbers, yellow keywords and global references, blue bindings and local variables,
white type references, purple members, brown HTML/JSX tags, muted comments, and
`#CCCCCC` operators. Existing italic, bold, and underline TextMate rules are
preserved separately from colors.

## Semantic highlighting

Semantic highlighting is enabled when `editor.semanticHighlighting.enabled` is
`configuredByTheme`, the VS Code default. Semantic colors are separate from
typography in the source; a small Dart keyword style layer preserves italics when
the provider replaces TextMate styling.

JS/TS uses the built-in provider's `local`, `declaration`, and `defaultLibrary`
modifiers to distinguish local symbols, declarations, and library functions.
Properties and methods remain purple, including declarations. Other languages use
the same standard semantic roles when their language extension supplies them.

Setting semantic highlighting to `false` keeps the TextMate fallback available.
See [Configuration](configuration.md#highlighting-controls) for the related
refinement setting.

## Contextual refinement

The refinement layer uses bundled parsers for local syntax and binding context,
not a project language server. No imports or project code are executed. It cannot
resolve every cross-file or language-server-specific symbol.

Refinement is active with both **CodePen Theme Original** variants. Files larger
than 250,000 UTF-16 code units, unsupported contexts, and parser failures retain
ordinary provider highlighting. Desktop and remote Node extension hosts are
supported; browser-only VS Code uses the color theme without the Node refinement
runtime. See [the refinement contract](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/REFINEMENT.md).

## Verification boundary

The [Twilight audit](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/TWILIGHT.md)
records 30 live CodePen JS/TS/JSX experiments, measured token colors,
cross-language mappings, and known parser and provider differences.
[`compatibility/twilight.json`](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/twilight.json)
records color expectations for all supported language fixtures; other languages
are role-based adaptations, not claims that CodePen supports those languages.

Bracket-pair rainbow foregrounds are transparent so they do not override syntax
colors. Unmeasured selection, search, error, workbench, and terminal states retain
their existing theme values rather than claiming an exact CodePen match. With
contextual refinement active, all 1,885 recorded nonblank JS/TS/JSX spans match
the live classic Twilight capture exactly; author italics remain unchanged.

The [full-language audit](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/LANGUAGE-AUDIT.md)
covers all 68 complete samples and records fixes and remaining provider limitations
per language. Just/Make recipe targets are purple; their variables and parameters
are blue. Java modifiers are yellow, type references white, and members purple.
Dart annotations use the same yellow role with and without semantic highlighting.
The exact list of verified languages and grammars that still use generic fallback
coverage is maintained in the
[syntax coverage boundary](https://github.com/ziqq/vscode_codepen_theme/blob/master/compatibility/COVERAGE.md).
