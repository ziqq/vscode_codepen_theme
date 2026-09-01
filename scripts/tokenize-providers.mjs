import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vscodeTextmate from 'vscode-textmate';
import vscodeOniguruma from 'vscode-oniguruma';
import { assertTokenColors, textmateTheme, tokenStyle } from './lib/token-colors.mjs';
import { ensureRecommendedProviders } from './lib/providers.mjs';
import {
  vscodeBuiltinExtensions,
  vscodeExecutable,
} from './lib/vscode-runtime.mjs';

const { Registry, parseRawGrammar } = vscodeTextmate;
const require = createRequire(import.meta.url);
const { refine } = require('../runtime/refine');
const palette = require('../src/colors');
const corrections = require('../compatibility/refinement-full.json').corrections;
const { createOnigScanner, createOnigString, loadWASM } = vscodeOniguruma;

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
// Compatibility fixtures include the classic italic decoration contract, so
// provider typography is exercised through the Ligatures variant.
const theme = JSON.parse(
  await readFile('themes/codepen-theme-ligatures.json', 'utf8'),
);
const twilight = JSON.parse(await readFile('compatibility/twilight.json', 'utf8'));
const fullSamples = JSON.parse(await readFile('compatibility/full-samples.json', 'utf8'));
const edgeCases = JSON.parse(await readFile('compatibility/edge-cases.json', 'utf8'));
const vscodeVersion = process.argv[2] ?? compatibility.verifiedVscodeVersion;
const executable = await vscodeExecutable(vscodeVersion);
const builtinRoot = process.env.CODEPEN_VSCODE_EXTENSIONS_DIR
  ? path.resolve(process.env.CODEPEN_VSCODE_EXTENSIONS_DIR)
  : await vscodeBuiltinExtensions(executable);
const externalProviders = await ensureRecommendedProviders(
  compatibility,
  vscodeVersion,
);

const grammarByScope = new Map();
const injections = new Map();

async function registerExtension(extensionRoot, providerId, overwrite) {
  const manifestPath = path.join(extensionRoot, 'package.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }
    throw error;
  }
  for (const grammar of manifest.contributes?.grammars ?? []) {
    const record = {
      providerId,
      file: path.resolve(extensionRoot, grammar.path),
      scopeName: grammar.scopeName,
    };
    if (overwrite || !grammarByScope.has(grammar.scopeName)) {
      grammarByScope.set(grammar.scopeName, record);
    }
    for (const target of grammar.injectTo ?? []) {
      const values = injections.get(target) ?? [];
      values.push(grammar.scopeName);
      injections.set(target, values);
    }
  }
}

for (const entry of await readdir(builtinRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'node_modules') {
    continue;
  }
  await registerExtension(
    path.join(builtinRoot, entry.name),
    `vscode.${entry.name}`,
    false,
  );
}

for (const provider of externalProviders) {
  await registerExtension(
    provider.extensionRoot,
    provider.provider.id,
    true,
  );
}

const wasm = await readFile(
  'node_modules/vscode-oniguruma/release/onig.wasm',
);
await loadWASM(
  wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength),
);

const registry = new Registry({
  theme: textmateTheme(theme),
  onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
  loadGrammar: async (scopeName) => {
    const grammar = grammarByScope.get(scopeName);
    if (!grammar) {
      return null;
    }
    return parseRawGrammar(await readFile(grammar.file, 'utf8'), grammar.file);
  },
  getInjections: (scopeName) => injections.get(scopeName) ?? [],
});

const results = [];
let failed = false;
for (const item of compatibility.cases) {
  const grammarRecord = grammarByScope.get(item.rootScope);
  if (!grammarRecord) {
    throw new Error(`${item.language}: grammar ${item.rootScope} is unavailable`);
  }
  if (grammarRecord.providerId.toLowerCase() !== item.provider.toLowerCase()) {
    throw new Error(
      `${item.language}: ${item.rootScope} came from ${grammarRecord.providerId}, expected ${item.provider}`,
    );
  }
  const grammar = await registry.loadGrammar(item.rootScope);
  if (!grammar) {
    throw new Error(`${item.language}: cannot load ${item.rootScope}`);
  }
  const source = await readFile(item.sample, 'utf8');
  const observed = new Set();
  const renderedSource = [];
  let ruleStack = null;
  for (const line of source.split(/\r?\n/)) {
    const tokenized = grammar.tokenizeLine(line, ruleStack);
    const styled = grammar.tokenizeLine2(line, ruleStack).tokens;
    const spans = [];
    for (const token of tokenized.tokens) {
      for (let index = 0; index < styled.length; index += 2) {
        const start = Math.max(token.startIndex, styled[index]);
        const end = Math.min(token.endIndex, styled[index + 2] ?? line.length, line.length);
        if (start >= end) continue;
        spans.push({ text: line.slice(start, end), start, scopes: token.scopes,
          ...tokenStyle(styled[index + 1], registry.getColorMap()) });
      }
    }
    renderedSource.push(spans);
    ruleStack = tokenized.ruleStack;
    for (const token of tokenized.tokens) {
      for (const scope of token.scopes) {
        observed.add(scope);
      }
    }
  }
  const missing = item.requiredScopes.filter((scope) => !observed.has(scope));
  const fixture = twilight.cases.find((entry) => entry.language === item.language);
  if (fixture?.sourceFile) fixture.source = await readFile(fixture.sourceFile, 'utf8');
  let colorAssertions = 0;
  let colorError;
  const fullColorErrors = [];
  const edgeColorErrors = [];
  let edgeColorAssertions = 0;
  const fullFixture = fullSamples.cases.find((entry) => entry.language === item.language);
  if (!fullFixture) throw new Error(`${item.language}: missing full-sample color fixture`);
  for (const expected of fullFixture.expect) {
    const fallback = expected.providerFallbacks?.[vscodeVersion];
    try {
      assertTokenColors(registry, grammar, { language: item.language, source,
        expect: [fallback ? { ...expected, foreground: fallback.foreground } : expected] });
    } catch (error) {
      fullColorErrors.push(error.message);
      failed = true;
      console.error(error.message);
    }
  }
  try {
    if (!fixture) throw new Error(`${item.language}: missing Twilight color fixture`);
    colorAssertions = assertTokenColors(registry, grammar, fixture);
  } catch (error) {
    colorError = error.message;
    failed = true;
    console.error(colorError);
  }
  if (missing.length > 0) {
    failed = true;
  }
  for (const edge of edgeCases.cases.filter((entry) => entry.language === item.language)) {
    for (const expected of edge.expect) {
      try {
        edgeColorAssertions += assertTokenColors(registry, grammar, {
          ...edge, language: `${item.language}/${edge.id}`, expect: [expected],
        });
      } catch (error) {
        edgeColorErrors.push(error.message);
        failed = true;
        console.error(error.message);
      }
    }
  }
  const refinedErrors = [];
  let refinedAssertions = 0;
  for (const candidate of [{ source, expect: fullFixture.expect, full: true },
    ...edgeCases.cases.filter((entry) => entry.language === item.language)]) {
    const spans = await refine(candidate.source, item.languageId);
    const lines = candidate.source.split('\n');
    const colors = [];
    let state = null;
    for (const line of lines) {
      const row = grammar.tokenizeLine2(line, state); state = row.ruleStack;
      const values = Array(line.length);
      for (let index = 0; index < row.tokens.length; index += 2) {
        values.fill(tokenStyle(row.tokens[index + 1], registry.getColorMap()).foreground,
          row.tokens[index], row.tokens[index + 2] ?? line.length);
      }
      colors.push(...values, undefined);
    }
    for (const span of spans) colors.fill(palette[span.role], span.start, span.end);
    for (const expected of candidate.expect) {
      refinedAssertions++;
      const correction = candidate.full && corrections.find((entry) => entry.language === item.language && entry.line === expected.line && entry.text === expected.text);
      const foreground = correction ? correction.foreground : expected.foreground;
      const base = lines.slice(0, expected.line - 1).reduce((sum, line) => sum + line.length + 1, 0);
      let start = -1;
      for (let index = 0; index < (expected.occurrence ?? 1); index++) start = lines[expected.line - 1].indexOf(expected.text, start + 1);
      try {
        assert.ok(start >= 0);
        assert.deepEqual([...new Set(colors.slice(base + start, base + start + expected.text.length))], [foreground],
          `${item.language}/${candidate.id ?? 'full'}:${expected.line} ${expected.text}: refined foreground`);
      } catch (error) { refinedErrors.push(error.message); failed = true; console.error(error.message); }
    }
  }
  results.push({
    language: item.language,
    sample: item.sample,
    provider: grammarRecord.providerId,
    rootScope: item.rootScope,
    observedScopes: [...observed].sort(),
    requiredScopes: item.requiredScopes,
    missingScopes: missing,
    colorAssertions,
    colorError,
    fullColorAssertions: fullFixture.expect.length,
    fullColorErrors,
    edgeColorAssertions,
    edgeColorErrors,
    refinedAssertions,
    refinedErrors,
    providerLimitations: fullFixture.expect.filter((entry) => entry.limitation || entry.providerFallbacks?.[vscodeVersion])
      .map((entry) => ({ line: entry.line, text: entry.text, expectedRoleColor: entry.foreground,
        ...(entry.providerFallbacks?.[vscodeVersion] ?? { reason: entry.limitation }) })),
    renderedSource,
  });
  console.log(
    `${item.language}: ${observed.size} scopes, ${missing.length} missing; ${colorAssertions} short + ${fullFixture.expect.length} full + ${edgeColorAssertions} edge + ${refinedAssertions} refined assertions; ${fullColorErrors.length + edgeColorErrors.length + refinedErrors.length} errors.`,
  );
}

const reportPath = `build/provider-tokenization-${vscodeVersion}.json`;
await writeFile(
  reportPath,
  `${JSON.stringify({ vscodeVersion, results }, null, 2)}\n`,
);
if (failed) {
  throw new Error(`Provider tokenization failed; inspect ${reportPath}`);
}
