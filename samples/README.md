# Syntax samples

Open these files in the Extension Development Host and use **Developer: Inspect Editor Tokens and Scopes** to verify CodePen colors against the active language provider.

Files under `samples/` are development fixtures and are excluded from the published VSIX.

Every syntax accepted by the contextual refinement runtime now has a complete
sample. TypeScript and JavaScript React are separate fixtures rather than being
inferred from the TSX sample. Six additional provider-only fixtures cover CSS,
SCSS, JSONC, TOML, YAML, and Go modules. The exact boundary between verified,
generic fallback, and plain-text behavior is documented in
[`compatibility/COVERAGE.md`](../compatibility/COVERAGE.md).

Recommended providers are documented in the root `README.md`. Current Visual Studio Code supplies the remaining built-in grammars.

Use the **Run Samples** launch configuration to open this directory with the
CodePen theme from the checkout and semantic highlighting configured by the theme.
F5 builds and watches the sources, then opens an isolated host with clean preview
settings and only the configured language providers. The normal VS Code profile
and its installed theme do not participate. See the root README for provider setup.
Disable semantic highlighting in this workspace to inspect the TextMate fallback,
then restore `configuredByTheme`. The machine-readable provider and scope baseline
lives in `compatibility/scopes.json`.

The scheduled Provider Compatibility workflow re-tokenizes every fixture with
the exact provider versions from that contract. Its representative visual cases
also produce real VS Code PNG screenshots as CI artifacts.
