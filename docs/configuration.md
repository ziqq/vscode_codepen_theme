# Configuration

## Theme variants

**CodePen Theme Original** uses the classic palette without adding theme-owned
italics. It retains bold and underline TextMate styles.

**CodePen Theme Original Ligatures** uses the same foreground and workbench colors
while retaining the theme's italic syntax layer. It also keeps narrow corrections
for Dart documentation and `Function` types.

## Typography defaults

The extension contributes the legacy font stack—`Operator Mono Lig`,
`Operator Mono`, `Monaco`, Courier, then `monospace`—for the editor, Debug
Console, and integrated terminal. Editor ligatures are enabled.

VS Code exposes Output as a Log-language editor, so its typography is contributed
through the `[Log]` language override rather than nonexistent `output.font*`
settings. Existing explicit user settings take precedence. These defaults apply
while the extension is installed because VS Code cannot scope font settings to a
selected color theme.

If Operator Mono is unavailable, VS Code uses the next installed font in the
stack. Terminal ligatures remain user-controlled so the extension stays compatible
with both sides of VS Code 1.97's terminal setting rename.

## Highlighting controls

Semantic highlighting follows `editor.semanticHighlighting.enabled`. The VS Code
default, `configuredByTheme`, enables the theme's semantic colors. Set it to
`false` to retain only the TextMate fallback.

Contextual refinement works in both modes. Disable
`codepen.syntaxRefinement.enabled` for a strictly provider-owned comparison or
before applying custom semantic and TextMate foreground overrides. Switching away
from both CodePen Theme variants also removes refinement decorations and stops the
worker.

See [Highlighting](highlighting.md) for the color contract and refinement boundary.
