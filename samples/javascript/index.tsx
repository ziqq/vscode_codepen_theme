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

// ---------------------------------------------------------------------------
// Extended showcase: hooks, generics in TSX, context, forwardRef, fragments.
// ---------------------------------------------------------------------------

import { createContext, forwardRef, memo, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

const MAX_VISIBLE = 8;
const ThemeContext = createContext<Theme | null>(null);

type Action =
  | { type: 'select'; token: TokenName }
  | { type: 'reset' };

interface ListProps<T> {
  readonly items: readonly T[];
  readonly render: (item: T, index: number) => ReactNode;
  readonly empty?: ReactNode;
}

function reducer(state: { selected: TokenName | null }, action: Action) {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.token };
    case 'reset':
    default:
      return { selected: null };
  }
}

function List<T extends { id: string }>({ items, render, empty = <em>Nothing here</em> }: ListProps<T>) {
  if (items.length === 0) return <>{empty}</>;
  return <ul className="token-list">{items.slice(0, MAX_VISIBLE).map((item, index) => <li key={item.id}>{render(item, index)}</li>)}</ul>;
}

export const useTheme = (): Theme => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
};

export const Swatch = memo(
  forwardRef<HTMLButtonElement, { token: TokenName; onPick?: (token: TokenName) => void }>(function Swatch(
    { token, onPick },
    ref,
  ) {
    const { tokens } = useTheme();
    const [hovered, setHovered] = useState(false);
    const style = useMemo<CSSProperties>(() => ({ color: tokens[token], opacity: hovered ? 1 : 0.85 }), [tokens, token, hovered]);
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={hovered}
        data-token={token}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onPick?.(token)}
        disabled={!onPick}
      >
        {token} &mdash; {tokens[token]}
      </button>
    );
  }),
);

export default function Palette({ title = 'Palette' }: { title?: string }) {
  const [state, dispatch] = useReducer(reducer, { selected: null });
  const firstRef = useRef<HTMLButtonElement>(null);
  const pick = useCallback((token: TokenName) => dispatch({ type: 'select', token }), []);

  useEffect(() => {
    firstRef.current?.focus();
    const id = window.setTimeout(() => dispatch({ type: 'reset' }), 5_000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <section aria-labelledby="palette-title" className={state.selected ? 'is-active' : undefined}>
        <h2 id="palette-title">{title}</h2>
        <List
          items={(['keyword', 'string', 'comment'] as const).map((id) => ({ id }))}
          render={({ id }, index) => <Swatch ref={index === 0 ? firstRef : undefined} token={id} onPick={pick} />}
        />
        {state.selected !== null && <p role="status">Selected: {state.selected}</p>}
        {/* JSX comment */}
      </section>
    </ThemeContext.Provider>
  );
}
