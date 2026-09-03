import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vscodeTextmate from 'vscode-textmate';
import vscodeOniguruma from 'vscode-oniguruma';
import { semanticColor, textmateTheme, tokenStyle } from './lib/token-colors.mjs';

const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));
const ligaturesTheme = JSON.parse(
  await readFile('themes/codepen-theme-ligatures.json', 'utf8'),
);
const twilight = JSON.parse(await readFile('compatibility/twilight.json', 'utf8'));
const compatibility = JSON.parse(await readFile('compatibility/scopes.json', 'utf8'));
const fullSamples = JSON.parse(await readFile('compatibility/full-samples.json', 'utf8'));
const edgeCases = JSON.parse(await readFile('compatibility/edge-cases.json', 'utf8'));
const palette = createRequire(import.meta.url)('../src/colors.js');
assert.deepEqual(Object.keys(palette), Object.keys(palette).sort(), 'Palette keys must be alphabetical');
for (let level = 1; level <= 6; level++) {
  assert.equal(theme.colors[`editorBracketHighlight.foreground${level}`], '#00000000');
}
assert.equal(twilight.schemaVersion, 1);
assert.equal(theme.colors['editor.background'], '#1d1e22');
assert.equal(theme.colors['editorLineNumber.foreground'], '#34363e');
assert.equal(theme.semanticHighlighting, true);
assert.deepEqual(ligaturesTheme.colors, theme.colors);
assert.deepEqual(
  ligaturesTheme.tokenColors.filter((rule) => rule.settings.foreground),
  theme.tokenColors.filter((rule) => rule.settings.foreground),
  'Ligatures must preserve all TextMate foreground rules',
);
assert.deepEqual(
  Object.fromEntries(Object.entries(ligaturesTheme.semanticTokenColors).map(
    ([selector, value]) => [
      selector,
      typeof value === 'string' ? value : value.foreground,
    ],
  )),
  Object.fromEntries(Object.entries(theme.semanticTokenColors).map(
    ([selector, value]) => [
      selector,
      typeof value === 'string' ? value : value.foreground,
    ],
  )),
  'Ligatures must preserve all semantic foregrounds',
);
assert.ok(!theme.tokenColors.some((rule) =>
  rule.settings.fontStyle?.split(/\s+/).includes('italic')));
assert.ok(!Object.values(theme.semanticTokenColors).some((value) =>
  typeof value === 'object' && value.italic === true));
assert.ok(ligaturesTheme.tokenColors.some((rule) =>
  rule.settings.fontStyle?.split(/\s+/).includes('italic')));
assert.ok(Object.values(ligaturesTheme.semanticTokenColors).some((value) =>
  typeof value === 'object' && value.italic === true));

const decorations = ligaturesTheme.tokenColors.filter((rule) =>
  rule.settings.fontStyle !== undefined);
assert.equal(
  createHash('sha256').update(JSON.stringify(decorations)).digest('hex'),
  twilight.decorationSha256,
  'Ligatures TextMate decorations must match the reviewed typography baseline',
);
for (const rule of theme.tokenColors) {
  assert.equal(Object.keys(rule.settings).length, 1, `${rule.name}: mixed color/style rule`);
}
for (const value of Object.values(theme.semanticTokenColors)) {
  assert.match(typeof value === 'string' ? value : value.foreground, /^#[0-9a-f]{6}$/i);
}
assert.equal(theme.semanticTokenColors['keyword:dart'], '#809bbd');
assert.equal(theme.semanticTokenColors['keyword.void:dart'].italic, false);
assert.equal(ligaturesTheme.semanticTokenColors['keyword:dart'].italic, true);
assert.equal(ligaturesTheme.semanticTokenColors['keyword.void:dart'].italic, false);
assert.deepEqual(
  twilight.cases.map((item) => item.language).sort(),
  compatibility.cases.map((item) => item.language).sort(),
  'Every supported language must have a real-provider color fixture',
);
for (const fixture of twilight.cases) {
  fixture.source ??= await readFile(fixture.sourceFile, 'utf8');
  assert.ok(fixture.expect.length >= 3, `${fixture.language}: insufficient color assertions`);
  for (const expected of fixture.expect) {
    assert.ok(expected.text.length > 0);
    assert.match(expected.foreground, /^#[0-9a-f]{6}$/);
    assert.ok(fixture.source.split('\n')[expected.line - 1]?.includes(expected.text));
  }
}
assert.deepEqual(fullSamples.cases.map((item) => item.language).sort(),
  compatibility.cases.map((item) => item.language).sort());
for (const fixture of fullSamples.cases) {
  const item = compatibility.cases.find((item) => item.language === fixture.language);
  const source = await readFile(item.sample, 'utf8');
  assert.ok(fixture.expect.length >= 6, `${fixture.language}: insufficient full-sample assertions`);
  for (const expected of fixture.expect) {
    assert.ok(source.split('\n')[expected.line - 1]?.includes(expected.text), `${fixture.language}:${expected.line} ${expected.text}`);
    assert.match(expected.foreground, /^#[0-9a-f]{6}$/);
    for (const [version, fallback] of Object.entries(expected.providerFallbacks ?? {})) {
      assert.ok(compatibility.testVscodeVersions.includes(version));
      assert.match(fallback.foreground, /^#[0-9a-f]{6}$/);
      assert.ok(fallback.reason.length > 0);
    }
  }
}
for (const fixture of edgeCases.cases) {
  assert.ok(compatibility.cases.some((item) => item.language === fixture.language));
  for (const expected of fixture.expect) {
    assert.ok(fixture.source.split('\n')[expected.line - 1]?.includes(expected.text));
    assert.match(expected.foreground, /^#[0-9a-f]{6}$/);
    for (const [version, fallback] of Object.entries(expected.providerFallbacks ?? {})) {
      assert.ok(compatibility.testVscodeVersions.includes(version));
      assert.match(fallback.foreground, /^#[0-9a-f]{6}$/);
      assert.ok(fallback.reason.length > 0);
    }
  }
}

// Exercise TextMate's actual selector resolution offline. The provider suite
// separately verifies the source -> scopes -> color path using real grammars.
const probes = [
  ['source.js keyword.operator.assignment.js', '#cccccc', 0],
  ['source.js storage.type.function.arrow.js', '#cccccc', 0],
  ['source.js meta.var.expr.js storage.type.js', '#809bbd', 1],
  ['source.js meta.function.js storage.type.function.js', '#809bbd', 1],
  // The real structural/semantic providers refine control-flow keywords to
  // blue. This raw TextMate scope retains the classic fallback before then.
  ['source.js keyword.control.conditional.js', '#ddca7e', 1],
  // The structural and semantic layers turn the declaration identifier purple;
  // this isolated raw TextMate stack retains the provider's blue fallback.
  ['source.js meta.function.js meta.definition.function.js entity.name.function.js', '#809bbd', 0],
  ['source.js meta.function-call.js entity.name.function.js', '#9a8297', 0],
  ['text.html.derivative meta.tag.structure.header.start.html punctuation.definition.tag.begin.html', '#a7925a', 0],
  ['text.html.derivative meta.tag.structure.header.start.html entity.other.attribute-name.html', '#ddca7e', 1],
  ['source.css.scss entity.other.attribute-name.class.css punctuation.definition.entity.css', '#ddca7e', 0],
  ['source.css.scss comment.line.scss punctuation.definition.comment.scss', '#717790', 0],
  ['source.css.scss comment.line.scss', '#717790', 1],
  ['source.css.scss keyword.control.at-rule.mixin.scss', '#809bbd', 1],
  ['source.css.scss constant.numeric.css keyword.other.unit.px.css', '#d0782a', 0],
  ['source.css support.type.property-name.css', '#9a8297', 0],
  ['source.less support.type.property-name.less', '#9a8297', 0],
  ['source.toml support.type.property-name.table.toml', '#9a8297', 0],
  ['source.json support.type.property-name.json', '#96b38a', 0],
  ['source.dart entity.name.function.dart', '#9a8297', 0],
  ['source.go entity.name.type.go', '#ddca7e', 0],
  ['source.just entity.name.function.target.just', '#9a8297', 0],
  ['source.tsx entity.name.type.alias.tsx', '#ddca7e', 0],
  ['source.tsx meta.type.annotation.tsx support.type.primitive.tsx', '#ddca7e', 0],
  ['source.ts meta.object.member.ts variable.other.readwrite.ts', '#9a8297', 0],
  ['source.ts meta.function-call.ts entity.name.function.ts', '#9a8297', 0],
  ['source.ts meta.decorator.ts punctuation.decorator.ts', '#809bbd', 0],
  ['source.java punctuation.definition.annotation.java', '#809bbd', 1],
  ['source.js string.quoted.single.js', '#96b38a', 0],
];
const wasm = await readFile('node_modules/vscode-oniguruma/release/onig.wasm');
await vscodeOniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const registry = new vscodeTextmate.Registry({
  theme: textmateTheme(ligaturesTheme),
  onigLib: Promise.resolve(vscodeOniguruma),
  loadGrammar: async () => ({
    scopeName: 'source.twilight-test',
    patterns: probes.map(([name], index) => ({ match: `\\bprobe${index}\\b`, name })),
  }),
});
const grammar = await registry.loadGrammar('source.twilight-test');
for (const [index, [, foreground, fontStyle]] of probes.entries()) {
  const tokens = grammar.tokenizeLine2(`probe${index}`, null).tokens;
  assert.deepEqual(tokenStyle(tokens[1], registry.getColorMap()), { foreground, fontStyle }, probes[index][0]);
}
registry.dispose();

let semanticAssertions = 0;
for (const { languageId } of compatibility.cases) {
  // Shared JS/TS roles are portable; this is selector coverage, not a claim
  // that every language server emits these exact modifiers.
  for (const [type, modifiers, expected] of [
    ['type', [], '#ddca7e'],
    ['class', ['declaration'], '#ddca7e'],
    ['parameter', [], '#ffffff'],
    ['method', ['declaration'], '#9a8297'],
    ['property', ['readonly'], '#9a8297'],
    ['enumMember', [], '#9a8297'],
    ['variable', ['defaultLibrary'], '#ffffff'],
    ['keyword', [], '#809bbd'],
  ]) {
    assert.equal(semanticColor(theme, type, modifiers, languageId), expected, `${languageId}: ${type}.${modifiers}`);
    semanticAssertions++;
  }
}
for (const language of ['typescript', 'typescriptreact']) {
  for (const type of ['type', 'interface', 'class', 'enum', 'typeParameter']) {
    assert.equal(semanticColor(theme, type, [], language), '#ddca7e');
    assert.equal(semanticColor(theme, type, ['declaration'], language), '#ddca7e');
    semanticAssertions += 2;
  }
}
for (const [type, expected] of [
  ['type', '#ddca7e'], ['typeParameter', '#ddca7e'],
  ['method', '#9a8297'], ['parameter', '#ffffff'],
  ['variable', '#ffffff'], ['property', '#9a8297'], ['enumMember', '#9a8297'],
]) {
  assert.equal(semanticColor(theme, type, [], 'dart'), expected);
  assert.equal(semanticColor(theme, type, ['declaration', 'instance'], 'dart'),
    type === 'variable' ? '#9a8297' : expected);
  semanticAssertions += 2;
}
for (const language of ['javascript', 'javascriptreact', 'typescript', 'typescriptreact']) {
  for (const type of ['variable', 'function']) {
    for (const [modifiers, expected] of [
      [[], type === 'function' ? '#9a8297' : '#ffffff'],
      [['declaration'], type === 'function' ? '#9a8297' : '#ffffff'],
      [['local'], type === 'function' ? '#9a8297' : '#ffffff'],
      [['readonly', 'local'], type === 'function' ? '#9a8297' : '#ffffff'],
      [['declaration', 'local'], type === 'function' ? '#9a8297' : '#ffffff'],
      [['defaultLibrary'], type === 'function' ? '#9a8297' : '#ffffff'],
    ]) {
      assert.equal(semanticColor(theme, type, modifiers, language), expected, `${language}: ${type}.${modifiers}`);
      semanticAssertions++;
    }
  }
}
for (const language of ['just', 'makefile']) {
  for (const modifiers of [[], ['declaration'], ['definition']]) {
    assert.equal(semanticColor(theme, 'function', modifiers, language), '#9a8297');
    semanticAssertions++;
  }
  assert.equal(semanticColor(theme, 'variable', [], language), '#809bbd');
  semanticAssertions++;
}
assert.equal(semanticColor(theme, 'property', ['annotation'], 'dart'), '#809bbd');
assert.equal(semanticColor(theme, 'annotation', [], 'dart'), '#809bbd');
assert.equal(semanticColor(theme, 'decorator', [], 'typescript'), '#809bbd');
semanticAssertions += 3;
console.log(`Twilight: ${probes.length} TextMate probes, ${semanticAssertions} semantic assertions, ${twilight.cases.length} provider fixtures, ${fullSamples.cases.reduce((count, item) => count + item.expect.length, 0)} full-sample assertions; typography baseline verified.`);
