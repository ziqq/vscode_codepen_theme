# Contextual Twilight refinement

## Contract

The local refinement layer is explicitly separate from the TextMate and semantic
palette. It starts only while a **CodePen Theme Original** variant is selected and
`codepen.syntaxRefinement.enabled` is true. It adds editor foreground decorations;
it does not register languages, grammars, semantic-token providers, formatting,
diagnostics, or language servers. Selecting another theme removes the decorations
and terminates the parser worker. The normal VS Code profile is not modified.

The measured JS/TS role policy remains:

- Blue bindings and local references; yellow global references and keywords.
- White type references; blue class/interface/enum declarations.
- Purple property and method names. Just recipes, aliases, and Make targets use
  that member role; their variables are blue.
- Green strings and interpolation delimiters; orange numeric literals; gray
  operators and type brackets; ordinary punctuation white.
- Original suppresses theme-owned italics while preserving bold and underline.
  Ligatures retains the italic layer. Narrow Dart corrections restore
  gray italic documentation and regular white `Function`/`void` types after the
  Dart provider has classified them as ordinary symbols or keywords.

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

CSS and SCSS retain their existing grammar symbol roles; the runtime only exposes
portable documentation markup inside comments. JSONC, TOML, YAML and Go module
files retain their existing grammar rules without runtime refinement.

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
   It also checks the runtime overlay against every
   full-sample and edge expectation. The seven intended full-sample corrections
   are explicit in `refinement-full.json`; contextual checks have no version-specific
   fallback exemptions. Native provider fallback assertions are not contextual matches.
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

Verified locally on 2026-09-01:

- 565 marked role assertions in 48 independently authored fixtures, plus 192
  incomplete-edit cases and lifecycle tests.
- All 68 full samples pass on VS Code 1.96.0, 1.105.1, 1.134.0 and 1.135.0
  with 299 short, 725 full, 94 edge, and 819
  contextual-overlay assertions; no failures.
- 161 actual-editor scenarios on VS Code 1.135.0: 48 contextual fixtures and
  30 reference fixtures in both semantic modes, plus five lifecycle scenarios
  including the Ligatures typography path;
  no color differences or typography failures. Real TS and Dart tokens
  were required for their semantic runs. Other servers are not certified.
- The 5.88 MiB VSIX passed asset/hash/license checks and installation in all three
  matrix versions. The normal profile's settings and extension-index hashes
  remained unchanged. Nothing was published or installed into the normal profile.

Contextual parsing matches **1,885 of 1,885** recorded nonblank CodePen spans.
[refinement-differences.json](refinement-differences.json) is intentionally empty,
and the audit rejects both new differences and stale exemptions. Exact compatibility
includes the classic parser's context transitions for type-only imports, mapped,
labelled and function types, assertion signatures, `satisfies` constraints, and JSX
expression scopes. These narrow rules apply only to the affected JS/TS/JSX syntax;
they do not recolor another language globally. Author italics are deliberately
excluded from CodePen foreground equivalence.

The older 1,818/1,885 TextMate and 1,846/1,885 native-semantic measurements describe
the baseline with refinement disabled. They are not scores for the new layer.

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
