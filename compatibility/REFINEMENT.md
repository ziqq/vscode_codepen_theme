# Contextual Twilight refinement

## Contract

The local refinement layer is explicitly separate from the TextMate and semantic
palette. It starts only while a **CodePen Theme Original** variant is selected and
`codepen.syntaxRefinement.enabled` is true. It adds editor foreground decorations;
it does not register languages, grammars, semantic-token providers, formatting,
diagnostics, or language servers. Selecting another theme removes the decorations
and terminates the parser worker. The normal VS Code profile is not modified.

The custom programming-language hierarchy keeps the CodePen palette but assigns
colors by syntax role:

- Ordinary bindings, value references, fields, properties, enum values, object
  keys, and named arguments are neutral white.
- Types and constructors are yellow. `void` is yellow and upright; selected
  language atoms such as `this`, `self`, and `super` retain the yellow role.
- Declaration, module, modifier, annotation, and control-flow syntax is blue:
  for example `class`, `interface`, `static`, `final`, `let`, `var`, `def`,
  `sub`, `required`, `override`, imports/exports, decorators, `return`, `try`,
  `catch`, `async`, `await`, `for`, and `yield`. Provider-specific declaration
  introducers such as Julia/Lua/PHP `function` use the same blue role.
- Function and method names are purple. Accessor/property names are white.
  Just recipes, aliases, and Make targets use the purple callable role; their
  variables remain blue.
- Green strings and interpolation delimiters; orange numeric literals plus
  `true`, `false`, and `null`; gray operators and type brackets; ordinary
  punctuation white.
- Original suppresses theme-owned italics while preserving bold and underline.
  Ligatures retains italics for blue declaration/control-flow/module groups,
  annotations, selected language keywords, and the existing italic comment
  layer. Just/Make-family files and SQL remain upright.

CodePen does not implement all these languages. Non-JS languages are adaptations
of these roles, not claims of a direct CodePen language implementation.

## Parsing and isolation

JS/TS/JSX uses the pinned TypeScript parser/checker against one in-memory file,
without standard libraries, import resolution, filesystem reads, or project code
execution. Other executable languages use pinned Tree-sitter WASM parsers and
local syntax/binding context. HTML, Vue, Svelte and fenced Markdown delegate their
embedded code to those parsers. CSS, SCSS and Sass documentation comments, Sass
punctuation, dotenv assignments and proven C4 declaration/reference names have
narrow format-specific refinements.

CSS, SCSS, Sass, and Less retain their existing grammar symbol roles, with
structural and flow at-directives normalized to blue italic as complete `@word`
tokens. The runtime also exposes portable documentation markup inside their
comments. Data/config
formats retain their own contracts; narrow format refiners distinguish literals
such as orange `null` without applying the programming hierarchy to keys.

Work runs outside the extension host in one worker. Edits are debounced for 80 ms;
only one parse runs at a time, with at most one latest queued version per document.
Results are applied only to the same document version. Closing a document,
disabling refinement and disposing the extension discard pending results.

Files exceeding 250,000 UTF-16 code units retain provider highlighting. A five
second parse deadline terminates a stalled worker. Three worker failures stop
retries until the refinement/theme configuration changes. Failures are written
to the `CodePen Syntax Refinement` output channel without source text.

The runtime requires a Node extension host (desktop or remote); browser-only
VS Code retains the declarative theme. Custom foreground overrides may be hidden
by refinement decorations; disable refinement when using such overrides.
Token Inspector still describes the underlying grammar and semantic provider,
not the final foreground decoration. Actual editor DOM captures verify the latter.

`npm run build` generates the ignored `runtime/` directory. Its file list and
SHA-256 hashes are verified both before packaging and inside the VSIX. Only the
selected WASM files, runtime code, palette and dependency licenses are shipped;
the large development parser package and its editor queries are excluded.

## Verification layers

1. `check:colors` preserves the decoration hash and checks palette/semantic selectors.
2. `test:providers` checks 68 complete real-grammar samples plus independent edge
   fixtures. The version matrix covers 1.96.0, 1.105.1, 1.134.0 and 1.135.0.
   It also checks the runtime overlay against every full-sample and edge
   expectation. Every actual provider-to-contextual transition is explicit in
   `refinement-full.json`; contextual checks have no version-specific fallback
   exemptions. Native provider fallback assertions are not contextual matches.
3. `test:refinement` checks independently marked source roles, UTF-16/CRLF offsets,
   incomplete edits, binding shadowing, embedded code, lifecycle and the immutable
   30-case CodePen reference. No expected snapshots are regenerated from the parser.
4. `test:refinement:editor -- 1.135.0` uses an isolated editor and explicit provider
   development paths. It checks visible source and computed foregrounds with
   semantic highlighting off/on, then exercises opt-out, theme switching and edits.
   The optional installed Dart provider/SDK is needed for its Dart semantic pass.
5. Existing screenshot tests disable refinement deliberately to keep the pure
   TextMate and native semantic baselines independently testable.

Example local editor check after `scripts/prepare-preview.mjs` has resolved the
cached providers:

```sh
npm run build
npm run test:refinement
CODEPEN_VSCODE_EXECUTABLE=/path/to/Code \
CODEPEN_DART_SDK=/path/to/dart-sdk \
npm run test:refinement:editor -- 1.135.0
```

## Reference boundary

Verified locally on 2026-09-09:

- 993 marked role assertions in 98 independently authored fixtures, plus 392
  incomplete-edit cases and lifecycle tests.
- All 68 full samples pass on VS Code 1.96.0, 1.105.1, 1.134.0 and 1.135.0
  with 300 short, 751 full, 94 edge, and 845
  contextual-overlay assertions; no failures.
- 239 actual-editor scenarios on VS Code 1.135.0: 87 contextual fixtures and
  30 reference fixtures in both semantic modes, plus five lifecycle scenarios
  including the Ligatures typography path;
  no color differences or typography failures. Real TS and Dart tokens
  were required for their semantic runs. Other servers are not certified.
- The 7.92 MiB VSIX passed asset/hash/license checks and installation in the
  isolated VS Code 1.135.0 screenshot profile. Provider and semantic-token
  checks passed on all four matrix versions. The normal profile's settings and
  extension-index hashes remained unchanged. Nothing was published or installed
  into the normal profile.

The contextual layer keeps **1,153 of 1,885** recorded nonblank CodePen spans
unchanged and records **732 reviewed differences** in
[refinement-differences.json](refinement-differences.json). Those differences are
the intentional GitHub-inspired role hierarchy rendered with CodePen colors, not
claims of exact classic-Twilight parity. The audit rejects both new differences
and stale exemptions. The classic parity branch is preserved separately as
`feature/theme-original-1.0.0`. Author italics are deliberately excluded from
foreground comparison.

With refinement disabled, the current TextMate layer matches 1,393/1,885 spans
on VS Code 1.135.0; its 492 differences are reviewed independently. Semantic and
contextual reports are separate and are not promoted to one another's scores.

## Remaining boundaries

This is local syntactic refinement, not full project-wide semantic analysis.
External symbols, macro-generated code, complex conditional compilation,
language dialects, unsupported template directives and parser recovery may retain
provider colors. Only actual TS and Dart service activation is certified by the
semantic editor checks; other installed language servers are not silently claimed
as tested. Passing these fixtures is not proof of every construct in every language.

The isolated editor logs also retain third-party diagnostics, separate from the
zero color/lifecycle assertion failures: dotenv 0.28.1's `autocloaking.js:30` reads
`event.document.uri` even though the open-document event supplies the document
itself; Kotlin reports conflicting contributed hint settings; the local VS Code
build reports unavailable native chat catalogs. These are not failures of the
theme worker. Provider installations and their runtime code were not patched.

Evidence: `build/refinement.json`, `build/refinement-reference.json`,
`build/refinement-editor.json` (with the temporary capture directory), and
`build/provider-tokenization-*.json`. The original CodePen corpus is unchanged.
