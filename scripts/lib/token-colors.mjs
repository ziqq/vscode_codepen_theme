/**
 * @file Decode real grammar token metadata and model the theme selectors used in assertions.
 * These helpers test colors; they do not replace VS Code runtime token inheritance.
 */

/**
 * @typedef {object} ColorFixture
 * @property {string} language Human-readable label used in assertion errors.
 * @property {string} source Exact source passed to the grammar.
 * @property {{line: number, text: string, occurrence?: number, foreground: string, fontStyle?: number}[]} expect Independently authored, one-based source-line expectations.
 */

import assert from 'node:assert/strict';

/**
 * Adapt a VS Code color-theme definition to vscode-textmate's registry format.
 *
 * @param {import('../../src/theme').ThemeDefinition} theme Generated theme to test.
 * @returns {import('vscode-textmate').IRawTheme} Registry-compatible default colors and scope settings.
 */
export function textmateTheme(theme) {
  return {
    settings: [
      { settings: {
        foreground: theme.colors['editor.foreground'],
        background: theme.colors['editor.background'],
      } },
      ...theme.tokenColors,
    ],
  };
}

/**
 * Decode foreground index and typography bits from TextMate token metadata.
 *
 * @param {number} metadata Encoded token metadata.
 * @param {string[]} colorMap Registry color table indexed by the metadata.
 * @returns {{foreground: string, fontStyle: number}} Normalized foreground and TextMate font-style bitmask.
 */
export function tokenStyle(metadata, colorMap) {
  return {
    foreground: colorMap[(metadata >>> 15) & 0x1ff].toLowerCase(),
    fontStyle: (metadata >>> 11) & 0xf,
  };
}

// Only the exact types used by this theme are resolved here. Unknown provider
// subtypes remain VS Code's responsibility, including their inheritance.
// Scoring follows VS Code's tokenClassificationRegistry: type 100, language 10,
// and 100 per modifier. This helper is for assertions, not extension runtime.
/**
 * Resolve only explicitly modeled semantic selectors using VS Code specificity scores.
 *
 * @param {import('../../src/theme').ThemeDefinition} theme Generated theme to inspect.
 * @param {string} type Provider token type.
 * @param {string[]} [modifiers] Provider token modifiers.
 * @param {string} [language] Optional language-specific selector suffix.
 * @returns {{foreground?: string, italic?: boolean, bold?: boolean, underline?: boolean} | undefined} Most-specific matching style or foreground, if present.
 */
export function semanticStyle(theme, type, modifiers = [], language = '') {
  let result;
  let best = -1;
  for (const [selector, value] of Object.entries(theme.semanticTokenColors)) {
    const [classifier, selectedLanguage] = selector.split(':');
    const [selectedType, ...required] = classifier.split('.');
    if (selectedType !== type ||
        (selectedLanguage !== undefined && selectedLanguage !== language) ||
        required.some((modifier) => !modifiers.includes(modifier))) continue;
    const score = 100 + (selectedLanguage === undefined ? 0 : 10) + required.length * 100;
    if (score >= best) {
      best = score;
      result = typeof value === 'string' ? { foreground: value } : value;
    }
  }
  return result;
}

/**
 * Read the modeled semantic foreground without inventing provider subtype inheritance.
 *
 * @param {import('../../src/theme').ThemeDefinition} theme Generated theme to inspect.
 * @param {string} type Provider token type.
 * @param {string[]} [modifiers] Provider token modifiers.
 * @param {string} [language] Optional language-specific selector suffix.
 * @returns {string | undefined} Most-specific matching style or foreground, if present.
 */
export function semanticColor(theme, type, modifiers = [], language = '') {
  return semanticStyle(theme, type, modifiers, language)?.foreground;
}

/**
 * Check every character of fixture spans against real grammar tokenization.
 * Repeated text is selected by occurrence and uncovered characters fail the assertion.
 *
 * @param {import('vscode-textmate').Registry} registry Registry supplying the color map.
 * @param {import('vscode-textmate').IGrammar} grammar Real provider grammar.
 * @param {ColorFixture} fixture Source text and independently authored color expectations.
 * @returns {number} Number of checked fixture expectations.
 */
export function assertTokenColors(registry, grammar, fixture) {
  const lines = fixture.source.split('\n');
  const tokenized = [];
  let state = null;
  for (const line of lines) {
    const result = grammar.tokenizeLine2(line, state);
    state = result.ruleStack;
    tokenized.push(result.tokens);
  }
  for (const expected of fixture.expect) {
    const line = lines[expected.line - 1];
    assert.ok(line !== undefined, `${fixture.language}: missing line ${expected.line}`);
    let start = -1;
    for (let occurrence = 0; occurrence < (expected.occurrence ?? 1); occurrence++) {
      start = line.indexOf(expected.text, start + 1);
      assert.ok(start >= 0, `${fixture.language}: missing ${expected.text}`);
    }
    const end = start + expected.text.length;
    const tokens = tokenized[expected.line - 1];
    let covered = 0;
    for (let index = 0; index < tokens.length; index += 2) {
      const from = Math.max(start, tokens[index]);
      const to = Math.min(end, tokens[index + 2] ?? line.length);
      if (from >= to) continue;
      covered += to - from;
      const actual = tokenStyle(tokens[index + 1], registry.getColorMap());
      const label = `${fixture.language}:${expected.line} ${JSON.stringify(line.slice(from, to))}`;
      assert.equal(actual.foreground, expected.foreground, `${label}: foreground`);
      if (expected.fontStyle !== undefined) {
        assert.equal(actual.fontStyle, expected.fontStyle, `${label}: fontStyle`);
      }
    }
    assert.equal(covered, expected.text.length, `${fixture.language}: incomplete token coverage`);
  }
  return fixture.expect.length;
}
