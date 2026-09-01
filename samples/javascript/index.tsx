import type { CSSProperties, ReactNode } from 'react';

type TokenName = 'keyword' | 'string' | 'comment';

type Theme = Readonly<{
  name: string;
  accent: `#${string}`;
  background: `#${string}`;
  tokens: Record<TokenName, `#${string}`>;
}>;

const theme: Theme = {
  name: 'CodePen Theme Original',
  accent: '#96b38a',
  background: '#1d1e22',
  tokens: {
    keyword: '#ddca7e',
    string: '#96b38a',
    comment: '#717790',
  },
};

const previewStyle: CSSProperties = {
  color: theme.accent,
  backgroundColor: theme.background,
};

const tokenLabel = (token: TokenName) => `${token}: ${theme.tokens[token]}`;

export const Preview = () => (
  <section aria-label={theme.name} style={previewStyle}>
    <strong data-accent={theme.accent}>{theme.name}</strong>
    <ul>
      {(Object.keys(theme.tokens) as TokenName[]).map((token) => (
        <li key={token} data-token={token}>{tokenLabel(token)}</li>
      ))}
    </ul>
  </section>
);

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; selected: TokenName }
  | { status: 'failed'; error: Error };

const Status = ({ state }: { readonly state: PreviewState }) => {
  switch (state.status) {
    case 'loading':
      return <span>Loading {theme.name}&hellip;</span>;
    case 'ready':
      return <mark data-token={state.selected}>{tokenLabel(state.selected)}</mark>;
    case 'failed':
      return <strong role="alert">{state.error.message}</strong>;
  }
};

export const ReadyPreview = () => (
  <PreviewProvider value={theme}>
    <Status state={{ status: 'ready', selected: 'keyword' }} />
  </PreviewProvider>
);

function PreviewProvider({ children }: { readonly children?: ReactNode; readonly value: Theme }) {
  return <section hidden>{children}</section>;
}
