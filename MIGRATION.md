# Migration from 0.12.x

Version `1.0.0` intentionally removes the old registered language definitions and
TextMate grammars. Before upgrading, install the language extensions you need from
the [recommended language extensions table](docs/language-support.md#recommended-language-extensions).
The new private WASM parsers only refine colors; they do not restore the removed
language registrations.

The following behavior changes are expected:

- `.c4` files are no longer registered by CodePen Theme. The recommended C4 extension targets Structurizr `.dsl` files.
- Kotlin script support depends on the installed Kotlin extension and the file types it registers.
- Language detection, brackets, comments, formatting, validation, and syntax scopes are owned by the installed language extension.
- Without a provider for a non-built-in language, Visual Studio Code may open the file as plain text.

Use **Developer: Inspect Editor Tokens and Scopes** when reporting a syntax color mismatch. Include the language extension name and the inspected TextMate scopes.
