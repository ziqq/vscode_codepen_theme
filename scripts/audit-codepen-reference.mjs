import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vscodeTextmate from 'vscode-textmate';
import vscodeOniguruma from 'vscode-oniguruma';
import { textmateTheme, tokenStyle } from './lib/token-colors.mjs';
import { vscodeBuiltinExtensions, vscodeExecutable } from './lib/vscode-runtime.mjs';

const reference = JSON.parse(await readFile('compatibility/codepen-reference.json', 'utf8'));
const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));
const reviewed = JSON.parse(await readFile('compatibility/codepen-reference-differences.json', 'utf8'));
const compatibility = JSON.parse(await readFile('compatibility/scopes.json', 'utf8'));
const version = process.argv[2] ?? compatibility.verifiedVscodeVersion;
const extensions = await vscodeBuiltinExtensions(await vscodeExecutable(version));
const wasm = await readFile('node_modules/vscode-oniguruma/release/onig.wasm');
await vscodeOniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const grammars = {
  javascript: ['javascript', 'JavaScript.tmLanguage.json', 'source.js'],
  typescript: ['typescript-basics', 'TypeScript.tmLanguage.json', 'source.ts'],
  jsx: ['javascript', 'JavaScriptReact.tmLanguage.json', 'source.js.jsx'],
};
const results = [];
const unexpected = [];
const usedRoleDifferences = new Set();
for (const fixture of reference.cases) {
  const [extension, grammarFile, scope] = grammars[fixture.mode];
  const grammarPath = path.join(extensions, extension, 'syntaxes', grammarFile);
  const registry = new vscodeTextmate.Registry({
    theme: textmateTheme(theme),
    onigLib: Promise.resolve(vscodeOniguruma),
    loadGrammar: async () => vscodeTextmate.parseRawGrammar(await readFile(grammarPath, 'utf8'), grammarPath),
  });
  const grammar = await registry.loadGrammar(scope);
  let state = null;
  let assertions = 0;
  const mismatches = [];
  for (const [line, referenceTokens] of fixture.lines.entries()) {
    const source = referenceTokens.map(([text]) => text).join('');
    assert.equal(source, fixture.source.split('\n')[line], `${fixture.id}: captured source integrity`);
    const scopes = grammar.tokenizeLine(source, state).tokens;
    const actual = grammar.tokenizeLine2(source, state);
    state = actual.ruleStack;
    let start = 0;
    for (const [text, cmScope, foreground] of referenceTokens) {
      const end = start + text.length;
      const colors = new Set();
      for (let index = 0; index < actual.tokens.length; index += 2) {
        const from = Math.max(start, actual.tokens[index]);
        const to = Math.min(end, actual.tokens[index + 2] ?? source.length);
        if (from < to && source.slice(from, to).trim()) {
          colors.add(tokenStyle(actual.tokens[index + 1], registry.getColorMap()).foreground);
        }
      }
      if (text.trim()) {
        assertions++;
        if (colors.size !== 1 || !colors.has(foreground)) {
          mismatches.push({ line: line + 1, start, text, cmScope, expected: foreground, actual: [...colors],
            scopes: scopes.filter((token) => token.startIndex < end && token.endIndex > start).map((token) => token.scopes) });
        }
      }
      start = end;
    }
  }
  registry.dispose();
  for (const mismatch of mismatches) {
    const exactDifference = reviewed.differences.find((item) => item.case === fixture.id &&
      item.line === mismatch.line && item.start === mismatch.start && item.text === mismatch.text &&
      item.expected === mismatch.expected && JSON.stringify(item.actual) === JSON.stringify(mismatch.actual));
    const roleDifference = reviewed.roleDifferences?.find((item, index) => {
      const accepted = item.modes.includes(fixture.mode) &&
        item.cmScope === mismatch.cmScope &&
        item.expected === mismatch.expected &&
        JSON.stringify(item.actual) === JSON.stringify(mismatch.actual) &&
        (!item.texts || item.texts.includes(mismatch.text));
      if (accepted) usedRoleDifferences.add(index);
      return accepted;
    });
    const accepted = exactDifference ?? roleDifference;
    if (!accepted) unexpected.push({ case: fixture.id, ...mismatch });
    else mismatch.reason = accepted.reason;
  }
  results.push({ id: fixture.id, mode: fixture.mode, assertions, mismatches });
  console.log(`${fixture.id}: ${assertions - mismatches.length}/${assertions} exact TextMate spans; ${mismatches.length} differences.`);
}
await writeFile(`build/codepen-reference-${version}.json`, `${JSON.stringify({
  version,
  verification: 'Measured CodePen DOM versus real TextMate rendering, before semantic tokens. Differences are reported, not silently accepted or counted as matches.',
  results,
}, null, 2)}\n`);
assert.equal(unexpected.length, 0, `Unreviewed CodePen differences:\n${JSON.stringify(unexpected, null, 2)}`);
assert.equal(
  usedRoleDifferences.size,
  reviewed.roleDifferences?.length ?? 0,
  'Stale CodePen role-difference policies must be removed',
);
