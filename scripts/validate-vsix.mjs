import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';

const vsixPath = process.argv[2];
if (!vsixPath) {
  throw new Error('Usage: node scripts/validate-vsix.mjs <path-to-vsix>');
}

const files = execFileSync('unzip', ['-Z1', vsixPath], { encoding: 'utf8' })
  .trim()
  .split('\n');

const requiredFiles = [
  'extension/package.json',
  'extension/assets/logo.png',
  'extension/themes/codepen-theme.json',
];

for (const requiredFile of requiredFiles) {
  if (!files.includes(requiredFile)) {
    throw new Error(`VSIX is missing ${requiredFile}`);
  }
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
  if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    throw new Error(`VSIX contains development or language asset: ${file}`);
  }
}

const themeSource = execFileSync(
  'unzip',
  ['-p', vsixPath, 'extension/themes/codepen-theme.json'],
  { encoding: 'utf8' },
);
const theme = JSON.parse(themeSource);

if (themeSource !== `${JSON.stringify(theme)}\n`) {
  throw new Error('Theme inside VSIX is not minified');
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
  JSON.stringify(Object.keys(manifest.contributes ?? {})) !==
  JSON.stringify(['themes'])
) {
  throw new Error('VSIX manifest must contribute only themes');
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
const maximumArchiveBytes = 5 * 1024 * 1024;
if (archive.size > maximumArchiveBytes) {
  throw new Error(
    `VSIX is ${(archive.size / 1024 / 1024).toFixed(2)} MiB; maximum is 5 MiB`,
  );
}

console.log(
  `VSIX is theme-only, minified, and ${(archive.size / 1024 / 1024).toFixed(2)} MiB (${files.length} files).`,
);
