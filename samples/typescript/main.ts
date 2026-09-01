import type { CSSProperties } from 'react';

type TokenName = 'keyword' | 'string' | 'comment';

type CustomProperties<T extends Record<string, string>> = {
  readonly [Key in keyof T as `--${string & Key}`]: T[Key];
};

interface Theme {
  readonly name: string;
  readonly tokens: Record<TokenName, `#${string}`>;
}

const theme = {
  name: 'CodePen Theme Original',
  tokens: {
    keyword: '#ddca7e',
    string: '#96b38a',
    comment: '#717790',
  },
} as const satisfies Theme;

function isTokenName(value: string): value is TokenName {
  return value in theme.tokens;
}

function assertTheme(value: unknown): asserts value is Theme {
  if (typeof value !== 'object' || value === null || !('tokens' in value)) {
    throw new TypeError('Invalid theme');
  }
}

class ThemeRegistry<T extends Theme> {
  readonly #themes = new Map<string, T>();

  register(value: T): this {
    assertTheme(value);
    this.#themes.set(value.name, value);
    return this;
  }
}

const style: CSSProperties & CustomProperties<typeof theme.tokens> = {
  color: theme.tokens.string,
  '--keyword': theme.tokens.keyword,
  '--string': theme.tokens.string,
  '--comment': theme.tokens.comment,
};

const tokenLabel = <Token extends TokenName>(token: Token, index = 0) =>
  `${index}: ${isTokenName(token) ? theme.tokens[token] : 'unknown'}`;

export { ThemeRegistry, style, theme, tokenLabel };
