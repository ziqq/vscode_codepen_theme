# Syntax coverage boundary

CodePen Theme is a color theme, so installed TextMate grammars receive the shared
Twilight fallback palette. Explicit coverage additionally pins the provider,
sample, required scopes, and source-span expectations for each language.

## Verified contract

The compatibility matrix contains 68 complete samples. Contextual refinement is
verified for JavaScript, JavaScript React, TypeScript, TypeScript React, C, C++,
C#, Dart, Go, Java, Just, Kotlin, Makefile, PHP, Python, Ruby, Rust, SQL, Swift,
Shell, HTML, Svelte, Vue, Markdown, dotenv, CSS, SCSS, Sass, and C4. CSS and SCSS
use only the conservative documentation-comment lexer rather than executable
symbol semantics. Provider-owned grammar highlighting without an additional
parser is verified for JSONC, TOML, YAML, and Go modules.

The remaining 35 cases certify every other user-facing grammar bundled with
VS Code 1.135.0:

- Batch, Clojure, CoffeeScript, CUDA C++, Diff, Dockerfile, F#, and Groovy;
- Handlebars, HLSL, INI/Properties, JSON, JSON Lines, Julia, and Less;
- TeX, LaTeX, BibTeX, Lua, Objective-C, Objective-C++, Perl, and Raku;
- PowerShell, Pug, R, Razor, reStructuredText, ShaderLab, Visual Basic, and WAT;
- XML, XSL, and Docker Compose.

Every language ID handled by the contextual runtime therefore has a complete
sample and real-provider test, and every user-facing built-in grammar has an
exact source-span color contract. Semantic-service verification remains
JS/TS-specific with an optional local Dart-Code run; the other cases certify
their real TextMate grammar output.

## Intentional exclusions

VS Code also contains internal or editor-specific languages such as Git commit
and rebase messages, ignore files, snippets, search results, logs, Markdown math,
and prompt/instruction/agent/skill files. They are intentionally not presented
as application-language support.

If a file opens as Plain Text because neither VS Code nor an installed extension
registers its language, a theme cannot add syntax tokenization by itself. Add or
select a grammar provider first; the generic palette then applies immediately.
