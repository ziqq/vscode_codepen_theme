import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vscodeTextmate from 'vscode-textmate';
import vscodeOniguruma from 'vscode-oniguruma';
import { ensureRecommendedProviders } from './lib/providers.mjs';
import {
  vscodeBuiltinExtensions,
  vscodeExecutable,
} from './lib/vscode-runtime.mjs';

const { Registry, parseRawGrammar } = vscodeTextmate;
const { createOnigScanner, createOnigString, loadWASM } = vscodeOniguruma;

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
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
  let ruleStack = null;
  for (const line of source.split(/\r?\n/)) {
    const tokenized = grammar.tokenizeLine(line, ruleStack);
    ruleStack = tokenized.ruleStack;
    for (const token of tokenized.tokens) {
      for (const scope of token.scopes) {
        observed.add(scope);
      }
    }
  }
  const missing = item.requiredScopes.filter((scope) => !observed.has(scope));
  if (missing.length > 0) {
    failed = true;
  }
  results.push({
    language: item.language,
    sample: item.sample,
    provider: grammarRecord.providerId,
    rootScope: item.rootScope,
    observedScopes: [...observed].sort(),
    requiredScopes: item.requiredScopes,
    missingScopes: missing,
  });
  console.log(
    `${item.language}: ${observed.size} scopes, ${missing.length} missing.`,
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
