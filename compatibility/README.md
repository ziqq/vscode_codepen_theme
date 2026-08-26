# Compatibility contract

`scopes.json` records the language provider, verified provider version, root
TextMate scope, representative token scopes, and sample file for every
supported syntax.

The contract has two layers:

1. Built-in and recommended extensions own language detection and grammars.
2. CodePen Theme owns provider-agnostic TextMate color mappings and more
   specific compatibility overrides.

Run `npm run check:compatibility` after changing providers, samples, or token
colors. Run `npm run visual:update` only when an intentional visual change has
been reviewed in the Extension Development Host.

Provider versions are verification baselines, not installation pins. Workspace
recommendations continue to install the current compatible release.

The scheduled `Provider Compatibility` workflow owns the network-heavy proof:

- install the theme-only VSIX across `testVscodeVersions`;
- load the exact built-in and recommended grammars and tokenize every sample;
- capture the cases marked `visual` in a real VS Code workbench and verify that
  the CodePen background and token palette were rendered;
- compare recorded provider versions and VS Code engine ranges with Marketplace
  metadata.

VS Code and provider archives are not downloaded by ordinary local commands.
The integration helpers allow downloads automatically only when `CI=true`, or
after an explicit local opt-in through their documented environment variables.
