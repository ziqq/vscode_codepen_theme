# CodePen Theme compatibility fixture

The extension is a **pure color theme**: Visual Studio Code and recommended
providers own language detection and grammars.

## Palette

- `#1d1e22` — editor background
- `#96b38a` — accent and strings
- `#ddca7e` — keywords

> Keep semantic highlighting disabled while comparing TextMate scopes.

```ts
const theme = 'CodePen Theme Original';
console.log(`Previewing ${theme}`);
```

Read the [compatibility contract](../../compatibility/scopes.json) before
changing a provider baseline.

## Review checklist

- [x] Built-in and recommended grammars have representative fixtures.
- [x] Inline `code`, **bold text**, and _emphasis_ keep distinct roles.
- [ ] Refresh visual screenshots only after reviewing intentional color changes.

| Role | Expected color | Example |
| --- | ---: | --- |
| Keyword | `#ddca7e` | `const`, `class`, `if` |
| String | `#96b38a` | `"CodePen Theme"` |
| Comment | `#717790` | `// provider-owned scope` |

<details>
<summary>Why providers matter</summary>

A color theme maps emitted scopes; it does not parse source files itself.

</details>

[^provider]: The compatibility runner resolves the grammar declared in the provider manifest.

## Extended showcase

Paragraph with **bold**, *italic*, ***both***, ~~strikethrough~~, `inline code`,
a [link](https://codepen.io "CodePen"), an autolink <https://example.com>, and an
image: ![logo](../../assets/logo.png). Line break with two spaces  
continues here. Escaped \*asterisks\* and HTML <kbd>Ctrl</kbd>+<kbd>K</kbd>.

### Lists

1. Ordered item
2. Second item
   - Nested bullet
   - [x] Done task
   - [ ] Open task
3. Third item

* Star bullet
+ Plus bullet

> **Note**
> Blockquotes can contain `code` and [links][ref].
>
> > Nested quote.

> [!WARNING]
> GitHub alert syntax.

### Code blocks

```dart
const palette = ThemePalette(background: '#1d1e22', accent: '#96b38a');
print(palette.contrastScore());
```

```ts
export const tokens = { keyword: '#ddca7e' } as const;
```

```bash
npm run build && npm run check
```

    Indented code block

### Table

| Role     | Color     | Italic |
| :------- | :-------: | -----: |
| keyword  | `#ddca7e` |     no |
| string   | `#96b38a` |     no |
| comment  | `#717790` |    yes |

---

Setext heading
--------------

Term with footnote[^note] and reference [ref].

[ref]: https://github.com/ziqq/vscode_codepen_theme
[^note]: Footnote text.

<!-- HTML comment -->
