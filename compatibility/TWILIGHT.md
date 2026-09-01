# Classic Twilight: measured JS/TS roles

The reference capture below is unchanged. Theme-only/provider limitations describe
the baseline with `codepen.syntaxRefinement.enabled` disabled. The subsequently
authorized [contextual refinement layer](REFINEMENT.md) addresses the constructor,
binding, Dart documentation/enum/type and cross-language context gaps separately.

## Reference capture

Observed on 2026-08-31 in the authenticated classic CodePen editor. A dedicated
scratch Pen was used; the original Pen was not edited. The scratch Pen was
deleted after capture. Each example was isolated and its visible source checked
against the submitted text before recording computed DOM foreground colors.

[codepen-reference.json](codepen-reference.json) contains **30 examples, 223
source lines, and 2,467 text fragments** (1,885 nonblank comparison spans).
Every fragment records its text, CodeMirror classes, and actual foreground.
Font styles are deliberately not the oracle: this theme keeps its own typography.

The correct parser matters. Plain JavaScript uses CodePen's None preprocessor,
TypeScript uses TypeScript, and JSX uses Babel. The classic TypeScript editor
does not correctly parse JSX; copying that output would reproduce parser errors.

### Variations captured

- JavaScript (6): bindings and lexical scope; properties/methods; literals and
  regular expressions; destructuring/rest; built-ins; async functions and JSDoc.
- TypeScript (20): alias/class contexts; bindings/blocks; functions/methods;
  generics; enums/namespaces; imports/exports; inheritance/class members;
  destructuring/rest; literals/interpolation; operators/control flow; mapped and
  conditional types; labels/switch/async; decorators/access; overloads/function
  types; tuples/arrays/index types; assertions/type queries; abstract classes;
  computed properties/symbols; nested utility types; documentation/escapes.
- JSX (4): HTML tags/expressions; components/fragments; events/spread attributes;
  nested maps and callbacks.

## Measured roles

| Role and context | CodeMirror class | Foreground |
| --- | --- | --- |
| Keywords; global variable/function references; atoms | `cm-keyword`, `cm-variable`, `cm-atom` | `#ddca7e` |
| Variable/function bindings, parameters, local references | `cm-def`, `cm-variable-2` | `#809bbd` |
| Class/interface/enum declaration names; declared enum members | `cm-def` | `#809bbd` |
| Type aliases (including their declarations), annotations, primitives, type parameters | `cm-type` | `#ffffff` |
| Properties and methods, both declarations and accesses | `cm-property` | `#9a8297` |
| Strings, entire regexes, template/interpolation delimiters | `cm-string`, `cm-string-2` | `#96b38a` |
| Numeric literals, including bigint suffix | `cm-number` | `#d0782a` |
| Symbolic operators, generic angle brackets, decorator `@` | `cm-operator` | `#cccccc` |
| Spread/rest `...` | `cm-meta` | `#9a8297` |
| HTML/JSX tags, component names, tag brackets | `cm-tag`, `cm-bracket` | `#a7925a` |
| Attributes | `cm-attribute` | `#ddca7e` |
| Comments, including JSDoc tags and types | `cm-comment` | `#717790` |
| Ordinary punctuation; JSX attribute `=` and expression braces | unclassified | `#ffffff` |

The same identifier can legitimately change color: `class Counter` declares a
blue binding, `value: Counter` is a white type reference, and `new Counter()` is
a yellow runtime reference in CodePen. A type alias declaration remains white.
Turning every type or every declaration yellow does not match this reference.

## Applying the roles to other languages

The declarative theme does not replace grammars or language servers. Shared
TextMate fallbacks and semantic selectors map equivalent roles; narrow
provider-specific rules correct known scope differences. Contextual refinement
now adds an optional foreground-only layer where those providers lose context.

- Types stay neutral; typed declarations are blue only when the provider exposes
  that declaration role. Parameters and local bindings are blue; members purple.
- JS/TS semantic `local` and `declaration` modifiers refine the lexical fallback.
  Readonly does not automatically mean yellow: a readonly member is still purple.
- Dart uses actual Dart-Code tokens: `variable.instance` is a field (purple),
  `property` and `method` are purple, a declared class is blue, constructor
  references are yellow, and ordinary type references are white.
- Java method parameters and C#/C/C++ primitive types have explicit rules. Free
  function declarations in Go/Python/Rust stay blue where distinguishable.
  Just/Make targets are explicitly purple; their variables stay blue.
  C#/Java methods stay purple.
- Data keys use the member role. Markup and stylesheet rules retain their own
  applicable roles; they are not treated as executable JS.

Palette keys are alphabetical. Existing TextMate decoration rules have an
unchanged SHA-256 guard. Semantic colors are authored separately from the small
Dart typography layer: keywords italic, `void` regular. Dart does not expose
fine-grained keyword subtypes for every existing TextMate distinction, so this
layer cannot recreate every keyword-by-keyword font distinction.

All six bracket-pair foregrounds are transparent. Bracket pair colorization may
remain enabled, but no rainbow colors replace white punctuation, gray generic
brackets, or green interpolation delimiters.

## Results and explicit limitations

On VS Code **1.96.0, 1.105.1, and 1.134.0**, the TextMate-only reference audit
matches **1,818 of 1,885 spans** exactly. The remaining **67 differences** are
recorded individually in [codepen-reference-differences.json](codepen-reference-differences.json),
with reasons. They are not counted as matches. New unreviewed differences fail
the audit; fixing an existing difference does not require keeping it broken.

The main boundaries are:

1. TextMate cannot recover lexical binding identity or always distinguish a free
   function call from a method call. JS/TS semantic fixtures separately verify
   these refinements; the 30-example reference score is not a semantic score.
2. Classic CodePen misparses some modern TS: `import type`, `satisfies`, labelled
   tuples, mapped/function-type parameters, assertion predicates, and some JSX
   callback scopes. The optional contextual layer deliberately reproduces those
   narrow foreground results for exact Twilight compatibility; the native
   TextMate/semantic baseline remains independently measured here.
3. Some TS grammar scopes are shared: `null`/`undefined` type positions share
   builtin-type scopes; ternary `:` shares an operator scope with `?`.
4. The TS semantic service emits the same class-reference token for constructors
   and annotations. Semantic class references therefore stay white, even though
   TextMate can color a syntactically recognized `new Counter()` yellow.
5. Dart does not emit declaration modifiers for the tested enum/enum-member
   declarations. Their semantic fallback is white/purple, not an invented blue
   declaration. The built-in Dart grammar leaves many plain names unclassified
   and does not distinguish top-level functions from methods; Dart-Code refines
   that. Grammar-only results will not be identical to semantic results.
   References inside Dart documentation links also carry ordinary member/type
   tokens without a documentation modifier, so they retain their symbol colors.
6. Standard semantic selector coverage does not certify every language server.
   The real-service checks cover JS/TS and the optional local Dart-Code run;
   the other language fixtures exercise real grammars, not their language servers.

The [full-sample follow-up](LANGUAGE-AUDIT.md) extends coverage to 68 language
fixtures with 299 short and 725 full-sample assertions, plus 35 real TypeScript
service assertions per matrix version. Offline checks exercise 20 TextMate
selector probes, 287 semantic selector assertions, and the unchanged-decoration
guard. The local Dart editor run checks 28 real semantic tokens plus visible
colors and italic keywords throughout the file.

No exact match is claimed for unmeasured workbench, terminal, selection, search,
or diagnostic colors. Existing values are retained. Missing React diagnostics in
standalone TSX samples are dependency diagnostics, not colors assigned by the
theme. The TS service test supplies a minimal virtual React/JSX declaration so
the tested TSX program resolves without adding a production dependency.

## Verification

Offline source checks:

```sh
npm run build
npm run check:colors
npm run lint
npm run check
```

With an existing VS Code executable and cached recommended providers:

```sh
export CODEPEN_VSCODE_EXECUTABLE=/path/to/Code
npm run test:providers -- 1.135.0
npm run test:semantic -- 1.135.0
npm run test:reference -- 1.135.0
```

Use the actual executable version, not an arbitrary report label. For the cached
three-version matrix, unset that override and explicitly permit runtime/provider
resolution (downloads are possible if a cache is missing):

```sh
unset CODEPEN_VSCODE_EXECUTABLE
CODEPEN_ALLOW_VSCODE_DOWNLOAD=1 CODEPEN_ALLOW_PROVIDER_DOWNLOAD=1 npm run test:provider-matrix
```

Real editor checks use the packaged VSIX in an isolated temporary profile:

```sh
npm run package
CODEPEN_VSCODE_EXECUTABLE=/path/to/Code npm run test:screenshots -- 1.135.0
CODEPEN_VSCODE_EXECUTABLE=/path/to/Code npm run test:screenshots:semantic -- 1.135.0
```

The optional Dart semantic run additionally needs both `CODEPEN_DART_SDK` pointing
to an installed Dart SDK and `CODEPEN_DART_EXTENSION` pointing to an installed
Dart-Code extension directory. It loads that provider in the temporary profile;
it does not install a provider in the user's editor. The local verification uses
Dart-Code 3.140.0 and Dart 3.11.5 with VS Code 1.135.0. CI does not implicitly
download or certify this optional Dart service.

Evidence is written to `build/provider-tokenization-*.json`,
`build/semantic-provider-*.json`, `build/codepen-reference-*.json`, and
`build/vscode-screenshots/`. The editor report includes rendered foregrounds and
font styles, plus real Dart tokens when opted in. The SVG overview is not a
replacement for token resolution or actual editor rendering.
