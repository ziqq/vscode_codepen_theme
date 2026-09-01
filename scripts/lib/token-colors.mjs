import assert from 'node:assert/strict';

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
export function semanticColor(theme, type, modifiers = [], language = '') {
  let result;
  let best = -1;
  for (const [selector, foreground] of Object.entries(theme.semanticTokenColors)) {
    const [classifier, selectedLanguage] = selector.split(':');
    const [selectedType, ...required] = classifier.split('.');
    if (selectedType !== type ||
        (selectedLanguage !== undefined && selectedLanguage !== language) ||
        required.some((modifier) => !modifiers.includes(modifier))) continue;
    const score = 100 + (selectedLanguage === undefined ? 0 : 10) + required.length * 100;
    if (score >= best) {
      best = score;
      result = typeof foreground === 'string' ? foreground : foreground.foreground;
    }
  }
  return result;
}

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
