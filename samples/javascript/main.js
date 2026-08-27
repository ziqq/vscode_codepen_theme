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
  return [theme.label(), ...lines].join('\n');
};

const preview = new ThemePreview('CodePen Theme Original');
console.log(renderPreview(preview));
