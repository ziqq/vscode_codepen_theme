import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { runtimeFiles } = require('../src/build-runtime.js');
const { themeVariants } = require('../src/theme-variants.js');

const vsixPath = process.argv[2];
if (!vsixPath) {
  throw new Error('Usage: node scripts/validate-vsix.mjs <path-to-vsix>');
}

const files = execFileSync('unzip', ['-Z1', vsixPath], { encoding: 'utf8' })
  .trim()
  .split('\n');

const documentationPaths = [
  'MIGRATION.md',
  'docs/configuration.md',
  'docs/development.md',
  'docs/highlighting.md',
  'docs/language-support.md',
  'docs/screenshots.md',
];

const requiredFiles = [
  'extension/package.json',
  'extension/readme.md',
  'extension/assets/logo.png',
  ...documentationPaths.map((documentationPath) =>
    `extension/${documentationPath}`),
  ...themeVariants.map((variant) => `extension/themes/${variant.file}`),
  'extension/runtime/extension.js',
  'extension/runtime/worker.js',
  'extension/runtime/manifest.json',
];

for (const requiredFile of requiredFiles) {
  if (!files.includes(requiredFile)) {
    throw new Error(`VSIX is missing ${requiredFile}`);
  }
}

for (const documentationPath of documentationPaths) {
  const packaged = execFileSync(
    'unzip',
    ['-p', vsixPath, `extension/${documentationPath}`],
    { encoding: 'utf8' },
  );
  const source = await readFile(documentationPath, 'utf8');
  if (packaged !== source) {
    throw new Error(`VSIX contains stale ${documentationPath}`);
  }
}

const packagedReadme = execFileSync(
  'unzip',
  ['-p', vsixPath, 'extension/readme.md'],
  { encoding: 'utf8' },
);
for (const documentationPath of documentationPaths) {
  const expectedLink =
    `https://github.com/ziqq/vscode_codepen_theme/blob/master/${documentationPath}`;
  if (!packagedReadme.includes(expectedLink)) {
    throw new Error(
      `Packaged README does not link ${documentationPath} through master`,
    );
  }
}
const expectedPreview =
  'https://github.com/ziqq/vscode_codepen_theme/raw/master/assets/preview_js.webp';
if (!packagedReadme.includes(expectedPreview)) {
  throw new Error('Packaged README preview does not resolve through master');
}

const forbiddenPrefixes = [
  'extension/.cache/',
  'extension/compatibility/',
  'extension/languages/',
  'extension/samples/',
  'extension/scripts/',
  'extension/snippets/',
  'extension/src/',
  'extension/syntaxes/',
];

for (const file of files) {
  if (file.endsWith('.log')) throw new Error(`VSIX contains a provider log: ${file}`);
  if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    throw new Error(`VSIX contains development or language asset: ${file}`);
  }
}

for (const variant of themeVariants) {
  const themeSource = execFileSync(
    'unzip',
    ['-p', vsixPath, `extension/themes/${variant.file}`],
    { encoding: 'utf8' },
  );
  const theme = JSON.parse(themeSource);
  if (themeSource !== `${JSON.stringify(theme)}\n`) {
    throw new Error(`${variant.label} inside VSIX is not minified`);
  }
}

const manifestSource = execFileSync(
  'unzip',
  ['-p', vsixPath, 'extension/package.json'],
  { encoding: 'utf8' },
);
const manifest = JSON.parse(manifestSource);
const sourceManifest = JSON.parse(await readFile('package.json', 'utf8'));
const visualBaselines = JSON.parse(
  await readFile('compatibility/visual-baselines.json', 'utf8'),
);

if (manifest.version !== sourceManifest.version) {
  throw new Error(
    `VSIX version ${manifest.version} does not match package.json ${sourceManifest.version}`,
  );
}

if (
  JSON.stringify(Object.keys(manifest.contributes ?? {}).sort()) !==
  JSON.stringify(['configuration', 'configurationDefaults', 'themes'])
) {
  throw new Error('VSIX has unexpected contribution points');
}
if (JSON.stringify(manifest.contributes.configurationDefaults) !==
    JSON.stringify(sourceManifest.contributes.configurationDefaults)) {
  throw new Error('VSIX has stale classic CodePen typography defaults');
}
if (manifest.main !== './runtime/extension.js') throw new Error('VSIX runtime entry point is missing');
const expectedRuntime = runtimeFiles();
const packagedRuntime = files.filter((file) => file.startsWith('extension/runtime/') && !file.endsWith('/'));
if (packagedRuntime.length !== expectedRuntime.size) throw new Error('Unexpected runtime file count in VSIX');
for (const [name, expected] of expectedRuntime) {
  const file = `extension/runtime/${name}`;
  if (!files.includes(file)) throw new Error(`VSIX is missing ${file}`);
  const bytes = execFileSync('unzip', ['-p', vsixPath, file], { maxBuffer: 32 * 1024 * 1024 });
  if (createHash('sha256').update(bytes).digest('hex') !== createHash('sha256').update(expected).digest('hex')) {
    throw new Error(`VSIX contains stale ${file}`);
  }
}

for (const file of files) {
  if (/extension\/assets\/preview_.*\.png$/i.test(file)) {
    throw new Error(`VSIX contains an unoptimized PNG preview: ${file}`);
  }
}

for (const asset of visualBaselines.assets) {
  const packagedPath = `extension/${asset.path}`;
  if (!files.includes(packagedPath)) {
    throw new Error(`VSIX is missing optimized preview ${packagedPath}`);
  }
}

const archive = await stat(vsixPath);
const maximumArchiveBytes = 12 * 1024 * 1024;
if (archive.size > maximumArchiveBytes) {
  throw new Error(
    `VSIX is ${(archive.size / 1024 / 1024).toFixed(2)} MiB; maximum is 12 MiB with pinned parsers`,
  );
}

console.log(
  `VSIX has verified theme and refinement assets, and is ${(archive.size / 1024 / 1024).toFixed(2)} MiB (${files.length} files).`,
);
