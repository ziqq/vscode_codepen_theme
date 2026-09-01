# Syntax coverage boundary

CodePen Theme is a color theme, so an installed TextMate grammar still receives
the shared Twilight fallback palette even when the language has no dedicated
fixture. “Not explicitly covered” below means that this repository does not yet
pin a provider, sample, required scopes, and source-span expectations for it. It
does not mean that VS Code necessarily renders the file without colors.

## Verified contract

The compatibility matrix contains 33 complete samples. Contextual refinement is
verified for JavaScript, JavaScript React, TypeScript, TypeScript React, C, C++,
C#, Dart, Go, Java, Just, Kotlin, Makefile, PHP, Python, Ruby, Rust, SQL, Swift,
Shell, HTML, Svelte, Vue, Markdown, dotenv, CSS, SCSS, Sass, and C4. CSS and SCSS
use only the conservative documentation-comment lexer rather than executable
symbol semantics. Provider-owned grammar highlighting without an additional
parser is verified for JSONC, TOML, YAML, and Go modules.

Every language ID handled by the contextual runtime therefore has a complete
sample and real-provider test. The contract covers TextMate output for all 33
samples; semantic-service verification remains JS/TS-specific with an optional
local Dart-Code run.

## No dedicated fixture yet

The following user-facing grammars bundled with VS Code 1.134.0 still rely on
the generic theme palette and are not explicitly certified by this repository:

- Batch, Clojure, CoffeeScript, CUDA C++, Diff, Dockerfile, F#, and Groovy;
- Handlebars, HLSL, INI/Properties, JSON, JSON Lines, Julia, and Less;
- TeX, LaTeX, BibTeX, Lua, Objective-C, Objective-C++, Perl, and Raku;
- PowerShell, Pug, R, Razor, reStructuredText, ShaderLab, Visual Basic, and WAT;
- XML, XSL, and Docker Compose.

VS Code also contains internal or editor-specific languages such as Git commit
and rebase messages, ignore files, snippets, search results, logs, Markdown math,
and prompt/instruction/agent/skill files. They are intentionally not presented
as application-language support.

If a file opens as Plain Text because neither VS Code nor an installed extension
registers its language, a theme cannot add syntax tokenization by itself. Add or
select a grammar provider first; the generic palette then applies immediately.
