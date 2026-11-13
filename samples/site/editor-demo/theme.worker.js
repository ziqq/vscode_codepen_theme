/** @file Apply the real TextMate theme and shared extension refiners outside the UI thread. */
import * as textmate from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';
import theme from '../../../themes/codepen-theme.json';
import palette from '../../../src/colors.js';
import { refineTypeScript } from '../../../src/syntax/typescript.js';
import { refineTree } from '../../../src/syntax/tree.js';
import ts from './grammars/TypeScript.tmLanguage.json';
import tsx from './grammars/TypeScriptReact.tmLanguage.json';
import dart from './grammars/dart.tmLanguage.json';
import rust from './grammars/rust.tmLanguage.json';
import jsdoc from './grammars/jsdoc.ts.injection.tmLanguage.json';
const grammars = new Map([ts, tsx, dart, rust, jsdoc].map(grammar => [grammar.scopeName, grammar]));
const scopes = { typescript: 'source.tsx', dart: 'source.dart', rust: 'source.rust' };
const ready = (async () => {
  const response = await fetch(new URL('./onig.wasm', import.meta.url));
  if (!response.ok) throw new Error(`Oniguruma: HTTP ${response.status}`);
  await oniguruma.loadWASM(await response.arrayBuffer());
  return new textmate.Registry({
    theme: { settings: [{ settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } }, ...theme.tokenColors] },
    onigLib: Promise.resolve({
      createOnigScanner: patterns => new oniguruma.OnigScanner(patterns),
      createOnigString: source => new oniguruma.OnigString(source),
    }),
    loadGrammar: async scope => grammars.get(scope) ?? null,
    getInjections: scope => ['source.ts', 'source.tsx'].includes(scope) ? ['documentation.injection.ts'] : [],
  });
})();

/** Compose the same foreground-only refinements over the theme's TextMate styles. */
async function highlight(source, language) {
  if (source.length > 250000) throw new Error('Preview limit: 250,000 characters');
  const registry = await ready;
  const grammar = await registry.loadGrammar(scopes[language]);
  const colorMap = registry.getColorMap();
  const base = [];
  let offset = 0;
  let state = textmate.INITIAL;
  for (const line of source.split('\n')) {
    const result = grammar.tokenizeLine2(line, state);
    state = result.ruleStack;
    for (let index = 0; index < result.tokens.length; index += 2) {
      const start = offset + result.tokens[index];
      const end = offset + (result.tokens[index + 2] ?? line.length);
      if (start < end) base.push({ start, end, foreground: colorMap[(result.tokens[index + 1] >>> 15) & 0x1ff], fontStyle: (result.tokens[index + 1] >>> 11) & 0xf });
    }
    offset += line.length + 1;
  }
  const corrections = language === 'typescript'
    ? refineTypeScript(source, 'typescriptreact')
    : await refineTree(source, language);
  const boundaries = [...new Set([0, source.length, ...base.flatMap(span => [span.start, span.end]), ...corrections.flatMap(span => [span.start, span.end])])].sort((a, b) => a - b);
  const output = [];
  let bi = 0;
  let ci = 0;
  for (let index = 0; index < boundaries.length - 1; index++) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    while (bi < base.length && base[bi].end <= start) bi++;
    while (ci < corrections.length && corrections[ci].end <= start) ci++;
    const token = base[bi]?.start <= start ? base[bi] : undefined;
    const correction = corrections[ci]?.start <= start ? corrections[ci] : undefined;
    const foreground = correction ? palette[correction.role] : token?.foreground ?? palette.white;
    const fontStyle = (token?.fontStyle ?? 0) | (correction?.fontStyle === 'annotation' ? 1 : 0);
    const previous = output.at(-1);
    if (previous?.end === start && previous.foreground === foreground && previous.fontStyle === fontStyle) previous.end = end;
    else output.push({ start, end, foreground, fontStyle });
  }
  return output;
}
let pending = Promise.resolve();
self.addEventListener('message', ({ data }) => {
  pending = pending.then(async () => {
    try { self.postMessage({ id: data.id, spans: await highlight(data.source, data.language) }); }
    catch (error) { self.postMessage({ id: data.id, error: String(error.message) }); }
  });
});
