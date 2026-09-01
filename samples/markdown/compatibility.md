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
