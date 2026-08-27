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
