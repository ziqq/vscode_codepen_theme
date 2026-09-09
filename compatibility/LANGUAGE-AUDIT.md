# Full-sample color audit

This document records the native TextMate/semantic baseline. Its provider-boundary
column remains useful when refinement is disabled. The follow-up
[contextual refinement audit](REFINEMENT.md) resolves the documented local context
gaps, including Dart callback types/docs/enums, Java bare reads, Just aliases,
Make separators and cross-language method/field identities. It has separate tests
and does not redefine the older fallback assertions as exact matches.

Follow-up review, 2026-08-31. The original short fixtures missed declaration,
member, interpolation, and type contexts present in the actual samples. This
pass reads and tokenizes every complete sample and records the resolved color,
font style, and full scope stack for each source span.

## Coverage

- 68 complete language/format samples, including dedicated related and embedded
  formats instead of inferring them from a neighboring grammar.
- 751 reviewed full-sample assertions in [full-samples.json](full-samples.json),
  in addition to 300 short regression assertions.
- All 68 cases pass on VS Code 1.96.0, 1.105.1, 1.134.0, and 1.135.0.
  Version-specific missing
  grammar context is explicit in `providerFallbacks`, with the intended role
  retained alongside the actual fallback; it is not silently treated as parity.
- The 30-case live CodePen JS/TS/JSX capture remains immutable. The custom
  TextMate hierarchy currently has 1,393/1,885 exact spans and 492 reviewed
  differences on VS Code 1.135.0.
- 637 offline semantic selector assertions and 35 actual JS/TS-service
  assertions. The optional real Dart-Code run checks 28 semantic tokens.
- Editor checks include Java, Dart, Just, and Make in addition to TSX, C4, Kotlin,
  and Vue. Dart is reviewed at the beginning, middle, and end, not only imports.

These counts are regression coverage, not proof that every construct in every
language server is covered. The detailed table below focuses on the 33 cases
with contextual-refinement or earlier provider-boundary findings. The additional
35 built-in cases are pinned by their provider, root scope, representative scopes,
and exact source-span expectations in the machine-readable contracts. Java was
checked with its built-in TextMate grammar; Java language-server semantic tokens
were not verified.

## Reviewed language results

| Language/format | Corrections or checked contexts | Remaining provider boundary |
| --- | --- | --- |
| C | Yellow primitive/builtin types and `sizeof`; white parameters; blue declarations | Many local names have no variable scope; free calls and member calls can share scopes |
| C++ | Purple methods, white fields/bindings, yellow types; gray reference `&` | Older grammars leave type + binding in one unclassified span; field reads can lack identity |
| C# | White properties/bindings; blue declarations/modifiers; purple methods; yellow types and `new` | Record constructor parameters are emitted as parameters |
| C4 | Keywords, element types, strings, nested model/views/styles checked | Provider does not classify ordinary identifiers |
| CSS | Properties/selectors checked; `fr` now orange like other numeric units | CSS-specific roles retained |
| Dart | Blue annotations/declarations/flow; yellow types and upright `void`; purple methods; white getters, fields, enum values, callback parameters, and pattern bindings | See the Dart details below |
| dotenv | Keys, quoted values, interpolation and comments checked | Unquoted value classification is provider-owned |
| Go modules | Blue italic `module`/`go`/`require`/`replace`/`exclude` and comments checked | Module paths are not executable variables |
| Go | Builtin calls `make`/`len`/`append` purple; values white; types yellow; format placeholders green | Receiver methods share free-function declaration scopes; property reads share variable scopes |
| HTML | Tags, attributes, nested CSS and JS checked | Existing doctype treatment retained |
| Java | Blue declarations/modifiers; yellow types; white fields and record components; purple methods; gray generics | Some record/method body names lack identity; constructor declarations share method scopes |
| JavaScript | Class, constructor, methods, callbacks, spread, imports and runtime references checked | Existing documented lexical/semantic differences remain |
| JavaScript React | JSX tags/attributes, nested maps, callback expressions, optional calls, fragments and text checked | Classic JSX expression-island roles intentionally differ from some native grammar scopes |
| JSONC | Nested keys, strings, booleans, orange numbers/`null`, and comments checked | Key quotes remain neutral punctuation; quoted key names are green |
| TypeScript | Mapped/key-remapped types, template literal types, `satisfies`, assertion predicates, private fields and generic arrows checked | Same CodePen and TS-provider limitations as the reference audit |
| TypeScript React | Alias/type references, bindings, JSX attributes/tags and generic brackets checked | Same CodePen and TS-provider limitations as the reference audit |
| Just | Recipes/dependencies purple; bindings, parameters and interpolation identifiers blue | Complex interpolation expressions depend on provider parsing |
| Kotlin | Blue declarations/modifiers/`fun`/flow, yellow types, white values, and strings checked | Ordinary identifiers are mostly unclassified without the language server |
| Makefile | Upright targets, prerequisites and `.PHONY` purple; ordinary/automatic variables blue | Recipe shell text is not parsed by the Make grammar; computed targets remain variables |
| Markdown | Headings, emphasis, inline code, links and embedded TypeScript checked | Existing prose decorations retained |
| PHP | Yellow primitive types; blue italic `function`/`array`/flow; purple methods; white promoted properties | Older grammar shares `as` with symbolic logical operators |
| Python | Blue declarations/decorators/flow; yellow types; white fields/bindings; green f-string delimiters | Class fields and local names can be unclassified; methods share free-function definition scopes |
| Rust | Purple call names; gray type brackets; green character delimiters | Definitions lack enclosing impl/method identity; field reads can be unclassified |
| Ruby | Definitions, arguments, member calls, symbols and strings checked | VS Code 1.96 grammar does not classify some member calls |
| Sass | Blue italic at-directives; units orange, including `ms`, `px`, `rem`, `%` | Grammar sometimes includes parentheses in function-name scopes; cannot split those by theme |
| SCSS | Blue italic mixin/include/use/flow directives; arguments, properties, units and nested selectors checked | Existing measured stylesheet-specific colors retained |
| SQL | Upright blue structural keywords, purple functions, orange booleans, CTEs, operators, strings, counts and sorting checked | Built-in grammar leaves `TRUE` unclassified and recognizes some column names as keywords |
| Svelte | Embedded TS, reactive declaration, events, loops, tags and CSS checked | Embedded provider parsing owns context |
| Shell | Bindings, functions, local parameters, loops, conditions and interpolation checked | Command classification differs from semantic local/global identity |
| Swift | Blue declaration/modifier syntax; yellow types; white fields/arguments; purple methods/calls; green interpolation delimiters | Bare declarations and some argument labels share unclassified or function scopes |
| TOML | Blue table/array-table names with white brackets; values, orange booleans and numbers checked | No runtime symbol semantics claimed |
| Vue | Embedded TS, computed values, methods, directives, template and CSS checked | Embedded provider parsing owns context |
| YAML | Keys, nested workflows, quoted strings and expressions checked | Schema-sensitive booleans and embedded syntax remain provider-owned |

## Dart details

TextMate and semantic behavior were checked independently. The original Dart
sample has 156 source lines; checking only its top viewport is insufficient.

- `fromAlias`, `map`, `maybeMap`, and `compareTo` use the purple callable role.
  Getter/accessor names, fields, callback arguments such as `fixed`, and pattern
  bindings such as `name` use neutral white.
- `@override` and other annotations are blue under TextMate, semantic, and
  contextual highlighting. Declaration/modifier keywords such as `final`,
  `required`, `class`, and `enum` are blue; executable flow is blue italic in
  the Ligatures variant.
- `Function` in `T Function()` and other type positions use yellow. `void` is a
  yellow upright type keyword in this hierarchy.
- Enum values remain white even when the provider omits a declaration modifier.
  Type-shaped documentation references are yellow; ordinary member references
  and inline code remain white. Generic angle brackets retain provider punctuation.
- Plain Dart TextMate names are often unclassified. Coloring the entire source
  or parameter container blue would also recolor punctuation and types, so no
  such broad workaround is applied.

These are actionable provider limitations, not a claim of complete visual
equivalence. Changing a theme cannot manufacture missing token categories.

## Just and Make policy

Recipe/target names and prerequisite names are **purple**, variables and recipe
parameters **blue**, and the entire Just/Make-family contract stays upright.
This is an explicit build-language adaptation requested by
the theme author. It does not change the measured fact that classic CodePen
uses blue for standalone JS function declarations as well as variable bindings.

Computed Make targets such as `$(OUTPUT)` remain blue because the visible token
is a variable reference. Make builtin `wildcard` retains the yellow builtin
function role. A target name is not confused with a variable value.

## Evidence and reruns

Run `npm run test:provider-matrix` with the existing explicit runtime/provider
opt-ins documented in [TWILIGHT.md](TWILIGHT.md#verification). Each
`build/provider-tokenization-<version>.json` contains `renderedSource`, exact
`fullColorErrors`, and separately reported `providerLimitations`.

Run `npm run test:screenshots` for eight real-editor cases, then
`npm run test:screenshots:semantic` with the optional Dart SDK/extension paths.
The latter records actual Dart token types/modifiers, not guessed LSP roles.
`editor-colors.json` checks foregrounds and selected italic keywords at multiple
scroll positions. PNGs and JSON reports are written under
`build/vscode-screenshots/<version>/<mode>/`.

The TextMate decoration contract is pinned by hash. No language provider is installed in
the user's profile, no grammar is bundled, and no release is published by these
checks.
