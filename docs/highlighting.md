# Highlighting

## Twilight colors

The palette follows the classic CodePen Twilight editor: green strings, orange
numbers, yellow keywords and global references, blue bindings and local variables,
white type references, purple members, brown HTML/JSX tags, muted comments, and
`#CCCCCC` operators. Existing italic, bold, and underline TextMate rules are
preserved separately from colors.

## Exact CodePen roles

The following foreground rules were measured directly in the classic CodePen
editor with JavaScript, TypeScript, and JSX. They are the source contract for
the Original themes:

| Role and context | Foreground |
| --- | --- |
| Keywords, global variable/function references, atoms | `#DDCA7E` |
| Variable/function bindings, parameters, local references | `#809BBD` |
| Class/interface/enum declaration names, declared enum members | `#809BBD` |
| Type aliases, annotations, primitives, type parameters | `#FFFFFF` |
| Property and method declarations and accesses | `#9A8297` |
| Strings, regexes, template/interpolation delimiters | `#96B38A` |
| Numeric literals | `#D0782A` |
| Symbolic operators, generic angle brackets, decorator `@` | `#CCCCCC` |
| Spread/rest `...` | `#9A8297` |
| HTML/JSX tags, components, tag brackets | `#A7925A` |
| Attributes | `#DDCA7E` |
| Comments, JSDoc tags and JSDoc types | `#717790` |
| Ordinary punctuation, JSX `=`, expression braces | `#FFFFFF` |

Color follows syntax role rather than spelling. For example, a declaration is
blue in `class Counter`, the type reference is white in `value: Counter`, and
the runtime/global reference is yellow in `new Counter()`. Likewise, Dart's
`kReleaseMode` is a yellow external runtime reference, while a local binding or
parameter is blue. A property or method remains purple.

The decorator marker is independently classified: `@` is `#CCCCCC`, while an
annotation name such as `override` uses the yellow keyword/global role.

## Adaptations outside CodePen

CodePen does not provide the same live parser evidence for every VS Code
language. JSON, Dart, and the other supported languages therefore adapt the
measured roles through their TextMate grammars and semantic-token providers;
they are not described as direct CodePen measurements.

Quoted JSON, JSONC, and JSON Lines keys are string literals. The complete key,
including its quotes, is green (`#96B38A`), as are string values. Unquoted
properties and members in programming languages are purple (`#9A8297`). JSON
numbers are orange, `true`, `false`, and `null` are yellow, punctuation is white,
and JSONC comments are muted gray.

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
