# Syntax samples

Open these files in the Extension Development Host and use **Developer: Inspect Editor Tokens and Scopes** to verify CodePen colors against the active language provider.

Files under `samples/` are development fixtures and are excluded from the published VSIX.

Recommended providers are documented in the root `README.md`. Current Visual Studio Code supplies the remaining built-in grammars.

Use the **Run Samples** launch configuration to open this directory with the
CodePen theme and semantic highlighting disabled. The machine-readable provider
and scope baseline lives in `compatibility/scopes.json`.

The scheduled Provider Compatibility workflow re-tokenizes every fixture with
the exact provider versions from that contract. Its representative visual cases
also produce real VS Code PNG screenshots as CI artifacts.
