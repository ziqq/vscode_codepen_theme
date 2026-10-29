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

type TokenEntry<Name extends TokenName = TokenName> = readonly [
  name: Name,
  color: Theme['tokens'][Name],
];

abstract class ThemeRenderer<TTheme extends Theme> {
  constructor(protected readonly value: TTheme) {}

  abstract render(): Iterable<TokenEntry>;
}

class TextThemeRenderer extends ThemeRenderer<typeof theme> {
  override *render(): Generator<TokenEntry> {
    for (const [name, color] of Object.entries(this.value.tokens)) {
      if (isTokenName(name)) yield [name, color];
    }
  }
}

const renderer = new TextThemeRenderer(theme);
const labels = [...renderer.render()].map(([name, color]) => `${name}=${color}`);
void labels;

// ---------------------------------------------------------------------------
// Extended showcase: enums, namespaces, decorators, overloads, async, guards.
// ---------------------------------------------------------------------------

export const MAX_TOKENS = 64;
export let activeTheme: Theme | undefined;
const HEX_COLOR = /^#(?<hex>[0-9a-f]{6})$/i;
const BIG_ID = 9_007_199_254_740_993n;

export enum Severity {
  Info = 1 << 0,
  Warning = 1 << 1,
  Error = 1 << 2,
}

declare const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

declare global {
  interface Window {
    __CODEPEN_THEME__?: Theme;
  }
}

namespace Colors {
  export const isHex = (value: string): boolean => HEX_COLOR.test(value);
}

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type Awaited2<T> = T extends PromiseLike<infer U> ? Awaited2<U> : T;
type EventName<T extends string> = `on${Capitalize<T>}`;

function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    console.log(`→ ${String(context.name)}(${args.join(', ')})`);
    return target.call(this, ...args);
  };
}

export class ThemeService implements Disposable {
  static #instances = 0;
  private readonly cache = new WeakMap<object, string>();
  protected severity: Severity = Severity.Info;
  public declare readonly id: number;

  constructor(private readonly registry: ThemeRegistry<Theme>) {
    ThemeService.#instances++;
  }

  get instances(): number {
    return ThemeService.#instances;
  }

  @logged
  resolve(name: string): string;
  resolve(name: string, fallback: `#${string}`): string;
  resolve(name: string, fallback?: string): string {
    return isTokenName(name) ? theme.tokens[name] : fallback ?? '#ffffff';
  }

  async load(url: URL, signal?: AbortSignal): Promise<Theme> {
    try {
      const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      assertTheme(data);
      return (activeTheme = data);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return theme;
      }
      throw error;
    } finally {
      this.severity |= Severity.Warning;
    }
  }

  [Symbol.dispose](): void {
    ThemeService.#instances--;
  }
}

export default async function* paginate<T>(
  pages: AsyncIterable<readonly T[]>,
  limit = MAX_TOKENS,
): AsyncGenerator<T, void, undefined> {
  let count = 0;
  for await (const page of pages) {
    for (const item of page) {
      if (++count > limit) return;
      yield item;
    }
  }
}

const merged = { ...theme, tokens: { ...theme.tokens } } satisfies DeepPartial<Theme>;
const percent = (MAX_TOKENS / 3).toFixed(2) as unknown as number;
const maybe = window.__CODEPEN_THEME__?.tokens?.keyword ?? merged.tokens.keyword;
void [percent, maybe, BIG_ID, Colors.isHex(maybe), Direction.Up];
