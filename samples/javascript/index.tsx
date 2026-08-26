type Theme = Readonly<{
  name: string;
  accent: `#${string}`;
}>;

const theme: Theme = {
  name: 'CodePen Theme Original',
  accent: '#96b38a',
};

export const Preview = () => <strong data-accent={theme.accent}>{theme.name}</strong>;
