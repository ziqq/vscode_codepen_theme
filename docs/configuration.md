# Configuration

## Theme variants

**CodePen Theme Original** uses the classic palette without the general
theme-owned italic layer. Annotations and decorators remain yellow and italic
in both variants; Original also retains bold and underline TextMate styles.

**CodePen Theme Original Italics** uses the same foreground and workbench colors
while retaining the theme's full italic syntax layer. It also keeps narrow corrections
for Dart documentation and `Function` types.

**CodePen Theme Custom** uses the same palette and workbench colors with a
GitHub-inspired role hierarchy: yellow types and selected atoms; blue
declarations, modifiers, annotations, module directives, and control flow;
purple callables; and white bindings, fields, properties, and enum values. It
adds no theme-owned italics. See [Highlighting: Custom](highlighting-custom.md).

**CodePen Theme Custom Italics** keeps every Custom foreground color and adds the
Custom italic syntax layer.

Contextual refinement follows the selected family: each family ships its own
classifiers, and switching themes restarts refinement with the matching set.

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
