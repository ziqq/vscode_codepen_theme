# Compatibility contract

`scopes.json` records the language provider, verified provider version, root
TextMate scope, representative token scopes, and sample file for every
supported syntax.

The contract has three layers:

1. Built-in and recommended extensions own language detection and grammars.
2. CodePen Theme owns provider-agnostic TextMate color mappings and more
   specific compatibility overrides.
3. Semantic rules apply the same roles when the installed language service can
   distinguish bindings, references, types, and members.

Run `npm run check:compatibility` after changing providers, samples, or token
colors. Run `npm run visual:update` only when an intentional visual change has
been reviewed in the Extension Development Host.

`twilight.json` contains source-span color expectations for every language and
the SHA-256 of the existing decoration rules. `check:colors` validates palette,
TextMate selector precedence, semantic colors, and preservation of decorations
without downloading providers. `test:providers` evaluates source spans using
the real grammar and TextMate theme resolver. The SVG is an overview, not a
replacement for that resolver (it does not model compound selectors).

`semantic.json` covers built-in JS/TS declarations, locals, globals, methods,
properties, and default-library symbols. `test:semantic` uses the TypeScript
language service shipped with the requested VS Code version. It verifies
semantic classifications plus the exact-type selectors used by this theme;
unknown provider subtypes and their inheritance are not simulated. Other
language servers are not implicitly certified by these JS/TS tests.

`codepen-reference.json` stores 30 measured live CodePen examples, including the
exact source, CodeMirror classes, and computed foregrounds. `test:reference`
compares every nonblank span with the real JS/TS/JSX grammars. The exact reviewed
differences in `codepen-reference-differences.json` remain visible in the report;
new differences fail the test. See [TWILIGHT.md](TWILIGHT.md) for the measured
roles and limitations. The provider matrix runs this audit on every version.

`test:refinement` separately compares the active contextual layer with the same
immutable corpus. It requires all 1,885 nonblank spans to match exactly;
`refinement-differences.json` is empty and stale exemptions fail the audit.

`editor-colors.json` checks actual rendered colors and selected font styles in
the screenshot harness. `dart-semantic.json` checks tokens returned by Dart-Code
when its optional SDK/extension paths are supplied. A built-in Dart grammar is
not a Dart semantic provider, and the ordinary CI matrix does not certify one.

The [full-language follow-up](LANGUAGE-AUDIT.md) records corrections and remaining
grammar limitations for all 68 samples. `full-samples.json` tests complete files;
provider reports include every rendered span, not just a list of observed scopes.
Known missing categories in older grammars are version-specific and reported
separately from exact role matches. Makefile is now a first-class matrix case.
[`COVERAGE.md`](COVERAGE.md) distinguishes this verified matrix from languages
that currently receive only the generic fallback palette.

Provider versions are verification baselines, not installation pins. Workspace
recommendations continue to install the current compatible release.

The scheduled `Provider Compatibility` workflow owns the network-heavy proof:

- install the theme and contextual-refinement VSIX across `testVscodeVersions`;
- load the exact built-in and recommended grammars and tokenize every sample;
- capture the cases marked `visual` in a real VS Code workbench and verify that
  the CodePen background and token palette were rendered;
- compare recorded provider versions and VS Code engine ranges with Marketplace
  metadata.

VS Code and provider archives are not downloaded by ordinary local commands.
The integration helpers allow downloads automatically only when `CI=true`, or
after an explicit local opt-in through their documented environment variables.
