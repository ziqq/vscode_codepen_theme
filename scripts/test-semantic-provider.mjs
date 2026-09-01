import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { semanticColor } from './lib/token-colors.mjs';
import { vscodeBuiltinExtensions, vscodeExecutable } from './lib/vscode-runtime.mjs';

const require = createRequire(import.meta.url);
const compatibility = JSON.parse(await readFile('compatibility/scopes.json', 'utf8'));
const fixtures = JSON.parse(await readFile('compatibility/semantic.json', 'utf8'));
const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));
const requestedVersion = process.argv[2] ?? compatibility.verifiedVscodeVersion;
const executable = await vscodeExecutable(requestedVersion);
const extensions = await vscodeBuiltinExtensions(executable);
const vscodeManifest = JSON.parse(await readFile(path.join(extensions, '..', 'package.json'), 'utf8'));
assert.equal(vscodeManifest.version, requestedVersion, 'Do not label a different local VS Code as a matrix version');
const ts = require(path.join(extensions, 'node_modules/typescript/lib/typescript.js'));

// This is the 2020 encoded classification legend used by VS Code's built-in
// JS/TS semantic provider (classifier2020.ts; member is exposed as method).
const types = ['class', 'enum', 'interface', 'namespace', 'typeParameter', 'type',
  'parameter', 'variable', 'enumMember', 'property', 'function', 'method'];
const modifiers = ['declaration', 'static', 'async', 'readonly', 'defaultLibrary', 'local'];
const results = [];
for (const fixture of fixtures.cases) {
  fixture.source ??= await readFile(fixture.sourceFile, 'utf8');
  const extension = { javascript: 'js', typescript: 'ts', typescriptreact: 'tsx' }[fixture.language];
  const file = path.resolve('samples/javascript', `semantic-test.${extension}`);
  const sources = new Map([[file, fixture.source],
    ...Object.entries(fixture.dependencies ?? {}).map(([name, text]) => [path.resolve('samples/javascript', name), text]),
  ]);
  const compilerOptions = {
    allowJs: true, checkJs: true, strict: true, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.Preserve,
  };
  const host = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => [...sources.keys()],
    getScriptVersion: () => '1',
    getScriptSnapshot: (name) => {
      const source = sources.get(name) ?? ts.sys.readFile(name);
      return source === undefined ? undefined : ts.ScriptSnapshot.fromString(source);
    },
    getCurrentDirectory: () => path.dirname(file),
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: (name) => sources.has(name) || ts.sys.fileExists(name),
    readFile: (name) => sources.get(name) ?? ts.sys.readFile(name),
    readDirectory: ts.sys.readDirectory,
  };
  const service = ts.createLanguageService(host);
  try {
    if (fixture.requireValidProgram) {
      const diagnostics = [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)];
      assert.equal(diagnostics.length, 0, diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'));
    }
    const { spans } = service.getEncodedSemanticClassifications(
      file, { start: 0, length: fixture.source.length }, ts.SemanticClassificationFormat.TwentyTwenty,
    );
    const tokens = [];
    for (let index = 0; index < spans.length; index += 3) {
      const [start, length, classification] = spans.slice(index, index + 3);
      const type = types[(classification >>> 8) - 1];
      assert.ok(type, `Unknown semantic classification ${classification}`);
      const tokenModifiers = modifiers.filter((_, bit) => classification & (1 << bit));
      tokens.push({ start, length, text: fixture.source.slice(start, start + length), type,
        modifiers: tokenModifiers, foreground: semanticColor(theme, type, tokenModifiers, fixture.language) });
    }
    const lines = fixture.source.split('\n');
    for (const expected of fixture.expect) {
      const offset = lines.slice(0, expected.line - 1).reduce((sum, line) => sum + line.length + 1, 0);
      const column = lines[expected.line - 1].indexOf(expected.text);
      assert.ok(column >= 0, `Missing fixture text ${expected.text}`);
      const token = tokens.find((candidate) => candidate.start === offset + column && candidate.text === expected.text);
      if (expected.absent) {
        assert.equal(token, undefined, `${expected.text}: expected TextMate-owned token`);
        continue;
      }
      assert.ok(token, `${fixture.language}:${expected.line}: no semantic token for ${expected.text}`);
      assert.equal(token.type, expected.type, `${expected.text}: semantic type`);
      assert.deepEqual([...token.modifiers].sort(), [...expected.modifiers].sort(), `${expected.text}: modifiers`);
      assert.equal(token.foreground, expected.foreground, `${expected.text}: semantic foreground`);
    }
    results.push({ language: fixture.language, assertions: fixture.expect.length, tokens });
    console.log(`${fixture.language}: ${fixture.expect.length} real TypeScript-service semantic assertions.`);
  } finally {
    service.dispose();
  }
}
await writeFile(`build/semantic-provider-${requestedVersion}.json`, `${JSON.stringify({
  vscodeVersion: vscodeManifest.version, typescriptVersion: ts.version,
  verification: 'Bundled TypeScript language-service classifications and theme selector resolution; not a screenshot or other language-server test.',
  results,
}, null, 2)}\n`);
