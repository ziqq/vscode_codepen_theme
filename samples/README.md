# Samples

The landing page and syntax fixtures have separate roots:

```text
samples/
├── README.md
├── site/                 # Published website
│   ├── index.html
│   ├── style.css
│   ├── index.js
│   ├── screenshots/      # Real VS Code captures
│   ├── CNAME
│   └── .nojekyll
└── fixtures/             # Language compatibility inputs
    ├── .vscode/          # Preview workspace settings
    ├── dart/
    ├── javascript/
    └── …
```

## Website

[Browse all 68 languages in the gallery](https://vscode-codepen-theme.ustinoff.dev/).
The entry point is `site/index.html`, styled by `site/style.css`, with screenshot
selection, filtering and enlargement in `site/index.js`. Captures are stored in
`site/screenshots/`. Publish the **contents** of `site/` at the GitHub Pages root;
`CNAME` and `.nojekyll` must be included. Fixture files are not website assets.

## Language fixtures

Open the files in `fixtures/` in the Extension Development Host and use **Developer: Inspect Editor Tokens and Scopes** to verify CodePen colors against the active language provider.

The entire `samples/` directory is excluded from the published VSIX.

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

Use the **Run Samples** launch configuration to open `fixtures/` with the
CodePen theme from the checkout and semantic highlighting configured by the theme.
F5 builds and watches the sources, then opens an isolated host with clean preview
settings and only the configured language providers. The normal VS Code profile
and its installed theme do not participate. See the root README for provider setup.
Disable semantic highlighting in this workspace to inspect the TextMate fallback,
then restore `configuredByTheme`. The machine-readable provider and scope baseline
lives in `compatibility/scopes.json`.

`npm run check:theme` enforces the exact fixture inventory in
`samples/fixtures/`, excluding only its `.vscode/` settings.
`npm run check:compatibility` validates the provider contract and sample
references. New fixture files require a matching contract entry; website files
under `samples/site/` do not participate in language coverage checks.

The scheduled Provider Compatibility workflow re-tokenizes all 68 fixtures with
the exact provider versions from that contract. Its representative visual cases
also produce real VS Code PNG screenshots as CI artifacts.
