import { format } from './format.js';

const palette = Object.freeze({
  background: '#1d1e22',
  accent: '#96b38a',
  keyword: '#ddca7e',
  comment: '#717790',
});

export class ThemePreview {
  constructor(name, tokens = palette) {
    this.name = name;
    this.tokens = tokens;
  }

  label(mode = 'dark') {
    return `${this.name} (${mode})`;
  }

  visibleTokens() {
    return Object.entries(this.tokens)
      .filter(([name]) => name !== 'background')
      .map(([name, color]) => ({ name, color }));
  }
}

export const renderPreview = (theme) => {
  const lines = theme.visibleTokens().map(({ name, color }) => `${name}: ${color}`);
  return format([theme.label(), ...lines].join('\n'));
};

const preview = new ThemePreview('CodePen Theme Original');
console.log(renderPreview(preview));

export async function* streamTokenLabels(theme, { signal } = {}) {
  for (const token of theme.visibleTokens()) {
    signal?.throwIfAborted();
    await Promise.resolve();
    yield `${token.name}=${token.color}`;
  }
}

const overrides = new Map([['accent', '#96b38a']]);
const resolvedAccent = overrides.get('accent') ?? palette.accent;
const summary = {
  ...palette,
  accent: resolvedAccent,
  tokenCount: preview.visibleTokens().length,
};

for await (const label of streamTokenLabels(preview)) {
  console.debug(label, summary.tokenCount);
}
