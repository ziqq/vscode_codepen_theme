import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { refine, maximumDocumentLength } = require('../runtime/refine');
const { keywordStyle } = require('../src/syntax/roles');
const fixtures = require('../compatibility/refinement.cjs');
const palette = require('../src/colors');
const failures = [];
const results = [];
let assertions = 0;
let recoveryCases = 0;
for (const [language, marked] of fixtures) {
  const expectations = [];
  let removed = 0;
  const source = marked.replace(/«(\w+)(?:\/(\w+))?\|([^»]+)»/g,
    (marker, role, fontStyle, text, at) => {
      expectations.push({ start: at - removed, end: at - removed + text.length,
        text, role, fontStyle });
      removed += marker.length - text.length;
      return text;
    });
  const start = performance.now();
  const spans = await refine(source, language);
  for (const expected of expectations) {
    assertions++;
    for (let offset = expected.start; offset < expected.end; offset++) {
      const actual = spans.find((span) => span.start <= offset && span.end > offset);
      if (actual?.role !== expected.role || expected.fontStyle &&
          actual?.fontStyle !== expected.fontStyle) {
        const wanted = `${expected.role}${expected.fontStyle ? `/${expected.fontStyle}` : ''}`;
        const received = `${actual?.role ?? 'fallback'}${actual?.fontStyle ? `/${actual.fontStyle}` : ''}`;
        failures.push(`${language}: ${JSON.stringify(expected.text)} at ${expected.start}: expected ${wanted}, got ${received} at ${offset}`);
        break;
      }
    }
  }
  let previous = 0;
  for (const span of spans) {
    assert.ok(span.start >= previous && span.end > span.start && span.end <= source.length);
    assert.ok(palette[span.role]); previous = span.end;
  }
  results.push({ language, source, expectations, spans, milliseconds: performance.now() - start });
  for (const end of [1, Math.floor(source.length / 3), Math.floor(source.length / 2), source.length - 1]) {
    const partial = await refine(source.slice(0, end), language);
    assert.ok(partial.every((span) => span.start >= 0 && span.end <= end), `${language}: invalid partial-document range`);
    recoveryCases++;
  }
}
for (const keyword of [
  'return', 'switch', 'case', 'try', 'catch', 'async', 'await', 'export',
  'function', 'this', 'self', 'super', 'for', 'yield',
]) {
  assert.deepEqual(keywordStyle(keyword), { role: 'yellow', fontStyle: 'italic' });
}
for (const keyword of [
  'override', 'required', '@interface', '@implementation', 'static', 'final',
  'let', 'var', 'def', 'class', 'interface', 'abstract', 'method', 'sub', 'my',
  'given', 'import', 'extends', 'implements', 'enum', 'get', 'set', 'fun', 'fn',
  'func', 'ns', 'of', 'register', 'Shader', 'Properties',
]) {
  assert.deepEqual(keywordStyle(keyword), { role: 'blue', fontStyle: 'italic' });
}
for (const keyword of [
  'new', 'typeof', 'sizeof', 'match', 'when', 'then', 'while', 'pass',
]) {
  assert.deepEqual(keywordStyle(keyword), { role: 'yellow', fontStyle: 'italic' });
}
assert.deepEqual(keywordStyle('as'), { role: 'white' });
assert.deepEqual(keywordStyle('null'), { role: 'orange' });
assert.deepEqual(await refine('x'.repeat(maximumDocumentLength + 1), 'typescript'), []);
assert.deepEqual(await refine('class Theme {}', 'plaintext'), []);
await writeFile('build/refinement.json', `${JSON.stringify({ assertions, recoveryCases, failures, results }, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join('\n'));
  throw new Error(`${failures.length}/${assertions} contextual syntax assertions failed`);
}
console.log(`${assertions} contextual syntax assertions and ${recoveryCases} incomplete-edit cases passed across ${results.length} fixtures.`);
