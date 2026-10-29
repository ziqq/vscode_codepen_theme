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

// ---------------------------------------------------------------------------
// Extended showcase: classes, private fields, generators, regex, async.
// ---------------------------------------------------------------------------

export const MAX_TOKENS = 64;
const HEX = /^#(?<hex>[\da-f]{6})$/giu;
let counter = 0b1010 + 0o17 + 0xff + 1e3;

/**
 * Debounce a callback.
 * @param {(...args: unknown[]) => void} callback
 * @param {number} [delay=100]
 * @returns {(...args: unknown[]) => void}
 */
export function debounce(callback, delay = 100) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback.apply(this, args), delay);
  };
}

export default class TokenCache extends Map {
  static #instances = 0;
  #hits = 0;

  static create() {
    TokenCache.#instances += 1;
    return new this();
  }

  get hits() {
    return this.#hits;
  }

  set hits(value) {
    if (typeof value !== 'number') throw new TypeError(`Expected number, got ${typeof value}`);
    this.#hits = value;
  }

  get(key) {
    if (super.has(key)) this.#hits++;
    return super.get(key) ?? null;
  }

  *[Symbol.iterator]() {
    yield* super.entries();
  }
}

async function loadPalette(url, { signal, retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { signal });
      const { tokens = {}, ...rest } = await response.json();
      return { ...rest, tokens: Object.entries(tokens).filter(([, color]) => HEX.test(color)) };
    } catch (error) {
      if (error?.name === 'AbortError' || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
    } finally {
      counter--;
    }
  }
}

const cache = TokenCache.create();
cache.set('accent', palette.accent);
const isReady = cache.size > 0 && !Number.isNaN(counter) || void 0;
let label = isReady ? `ready (${cache.hits} hits)` : 'pending';
label &&= label.trim?.();
globalThis.__TOKENS__ ??= [];
loadPalette(new URL('./palette.json', import.meta.url)).then(console.log, console.error);
