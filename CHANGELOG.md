# Changelog

## 1.0.0
- **BREAKING_CHANGES**: removed every bundled language definition, TextMate grammar, language configuration, and snippet
- **CHANGED**: the extension now contributes only the CodePen color theme
- **CHANGED**: the checked-in theme is generated from `src/colors.js` and `src/theme.js`
- **CHANGED**: the generated theme is minified before packaging
- **CHANGED**: syntax scopes for non-built-in formats are provided by recommended language extensions
- **CHANGED**: provider-agnostic TextMate defaults preserve colors across grammar updates
- **CHANGED**: minimum supported Visual Studio Code version is now `1.96.0`
- **CHANGED**: preview screenshots use optimized local WebP assets and VSIX size is limited
- **ADDED**: migration guidance and a curated list of language providers
- **ADDED**: syntax samples and CI validation for generated sources and VSIX contents
- **ADDED**: provider-version and representative TextMate scope compatibility contract
- **ADDED**: generated visual baseline and reviewed screenshot integrity checks
- **ADDED**: CI-only installation and real-provider tokenization checks for VS Code `1.96.0`, `1.105.1`, and `1.134.0`
- **ADDED**: real VS Code screenshot smoke tests for representative built-in and recommended providers
- **ADDED**: scheduled Marketplace provider-version and engine-drift monitoring
- **ADDED**: generated README provider compatibility table with version bands
- **ADDED**: release tag/package/changelog consistency guard

## 0.12.1
- **ADDED**: `justfile` language support with Makefile-style syntax highlighting

## 0.12.0
- **ADDED**: `dsl` syntax highlighting support (CoCoNut DSL / C4 Model)

## 0.11.2
- **CHANGED**: `js` syntax highlighting for `ts` and `tsx` files
-
## 0.11.1
- **CHANGED**: `dart` syntax highlighting (comment block)

## 0.11.0
- **ADDED**: `env` syntax highlighting
- **ADDED**: `rust` syntax highlighting
- **ADDED**: `toml` syntax highlighting
- **ADDED**: `java` syntax highlighting
- **ADDED**: `go.mod` and `go.sum` syntaxes highlighting

## 0.10.3
- **CHANGED**: `yaml` syntax highlighting (comment block)

## 0.10.2
- **ADDED**: `gradle` syntax highlighting
- **FIXED**: `SASS` and `SCSS` syntax highlighting

## 0.10.1
- **CHANGED**: Package meta data

## 0.10.0
- **ADDED**: `SASS` and `SCSS` syntax highlighting

## 0.9.1
- **CHANGED**: `Python` syntax highlighting

## 0.9.0
- **ADDED**: `Python` syntax highlighting
- **ADDED**: `GO` syntax highlighting
- **CHANGED**: `JS` syntax highlighting
-
## 0.8.1
- **ADDED**: `makefile` syntax highlighting
-
## 0.8.0
- **ADDED**: `yaml` syntax highlighting

## 0.7.1
- **CHANGED**: Package meta info
- **CHANGED**: `Markdown` syntax highlighting

## 0.7.0
- **ADDED**: `SQL` syntax highlighting, [#2](https://github.com/ziqq/vscode_codepen_theme/issues/2)
- **CHANGED**: Base colors to origin from `codepen.io`
- **CHANGED**: Syntax highlighting for (`JSON`, `JS`, `CSS`, `HTML`, `DART`)

## 0.6.0 - 0.6.3
- **CHANGED**: `JavaScript` syntax highlighting

## 0.5.0
- **ADDED**: `Dart` syntax highlighting

## 0.4.0
- **ADDED**: `JSON` syntax highlighting

## 0.3.0
- **ADDED**: `JavaScript` syntax highlighting

## 0.2.0
- **ADDED**: `HTML` and `CSS` syntaxes highlighting

## 0.1.0
- **ADDED**: Stable release

## 0.0.1
- **ADDED**: Initial release
