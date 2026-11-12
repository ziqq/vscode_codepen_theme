# Syntax samples

Open these files in the Extension Development Host and use **Developer: Inspect Editor Tokens and Scopes** to verify CodePen colors against the active language provider.

Files under `samples/` are development fixtures and are excluded from the published VSIX.

All 68 user-facing language and format cases in the compatibility contract have
complete samples. They cover every syntax accepted by the contextual refinement
runtime, the previously provider-only fixtures, and the remaining user-facing
grammars bundled with VS Code 1.135.0. TypeScript, JavaScript React, JSON, JSONC,
JSON Lines, Dockerfile, Docker Compose, TeX, LaTeX, BibTeX, XML, and XSL use
separate fixtures so embedded or related grammars are never inferred from one
another. The exact boundary between verified, internal/editor-only, and
plain-text behavior is documented in
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

`npm run check:compatibility` rejects missing fixture files, duplicate sample
references, and any source file added under `samples/` without a matching
provider contract. `README.md` and `.vscode/` are the only non-fixture paths.

The scheduled Provider Compatibility workflow re-tokenizes all 68 fixtures with
the exact provider versions from that contract. Its representative visual cases
also produce real VS Code PNG screenshots as CI artifacts.
