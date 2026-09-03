import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { refine } = require('../runtime/refine');
const palette = require('../src/colors');
const reference = JSON.parse(await readFile('compatibility/codepen-reference.json', 'utf8'));
const reviewed = JSON.parse(await readFile('compatibility/refinement-differences.json', 'utf8')).differences;
const results = [];
const usedReviewed = new Set();
const unexpected = [];
const changed = [];
let total = 0, exact = 0;
for (const fixture of reference.cases) {
  const spans = await refine(fixture.source, { javascript: 'javascript', typescript: 'typescript', jsx: 'javascriptreact' }[fixture.mode]);
  const colors = Array(fixture.source.length).fill(palette.white);
  for (const span of spans) colors.fill(palette[span.role], span.start, span.end);
  let offset = 0;
  const differences = [];
  for (const [line, tokens] of fixture.lines.entries()) {
    let start = 0;
    for (const [text, , expected] of tokens) {
      if (text.trim()) {
        total++;
        const actual = [...new Set(colors.slice(offset + start, offset + start + text.length))];
        if (actual.length === 1 && actual[0] === expected) exact++;
        else {
          const accepted = reviewed.find((item) => item.case === fixture.id && item.line === line + 1 && item.start === start && item.text === text);
          const detail = { case: fixture.id, line: line + 1, start, text, expected, actual };
          if (!accepted) unexpected.push(detail);
          else if (JSON.stringify(actual) !== JSON.stringify([accepted.actual])) {
            changed.push({ ...detail, reviewedActual: accepted.actual });
          } else {
            usedReviewed.add(accepted);
            differences.push({ line: line + 1, start, text, expected, actual, reason: accepted.reason });
          }
        }
      }
      start += text.length;
    }
    offset += start + 1;
  }
  results.push({ id: fixture.id, differences });
}
const stale = reviewed.filter((item) => !usedReviewed.has(item));
assert.equal(unexpected.length + changed.length + stale.length, 0,
  `Contextual-reference review drift:\n${JSON.stringify({ unexpected, changed, stale }, null, 2)}`);
await writeFile('build/refinement-reference.json', `${JSON.stringify({ total, exact, differences: total - exact, results }, null, 2)}\n`);
console.log(`Contextual reference: ${exact}/${total} exact spans; ${total - exact} differences.`);
