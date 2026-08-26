import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  throw new Error('Usage: node scripts/generate-readme.mjs [--check|--write]');
}

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const readmePath = 'README.md';
const readme = await readFile(readmePath, 'utf8');
const startMarker = '<!-- provider-table:start -->';
const endMarker = '<!-- provider-table:end -->';

const providers = compatibility.providers.filter(
  (provider) => provider.kind === 'recommended',
);
const rows = providers.map((provider) => {
  const languages = compatibility.cases
    .filter(
      (item) => item.provider.toLowerCase() === provider.id.toLowerCase(),
    )
    .map((item) => item.language)
    .join(', ');
  const extension = `[${provider.displayName}](https://marketplace.visualstudio.com/items?itemName=${provider.id})`;
  const bands = provider.compatibility
    .map((band) => `\`${band.version}\` for \`${band.vscode}\``)
    .join('<br>');
  return `| ${languages} | ${extension} | ${bands} |`;
});

const generated = [
  startMarker,
  '| Language or format | Extension | Compatible provider versions |',
  '| --- | --- | --- |',
  ...rows,
  '',
  `Provider contracts were verified with VS Code \`${compatibility.verifiedVscodeVersion}\` on ${compatibility.verifiedAt}. Version bands are compatibility baselines, not installation pins.`,
  `CI integration matrix: ${compatibility.testVscodeVersions.map((version) => `\`${version}\``).join(', ')}.`,
  endMarker,
].join('\n');

const start = readme.indexOf(startMarker);
const end = readme.indexOf(endMarker);
if (start === -1 || end === -1 || end < start) {
  throw new Error('README provider table markers are missing or invalid');
}

const expected = `${readme.slice(0, start)}${generated}${readme.slice(
  end + endMarker.length,
)}`;

if (mode === '--write') {
  await writeFile(readmePath, expected);
  console.log('Updated generated README provider table.');
} else if (readme !== expected) {
  throw new Error('README provider table is stale; run npm run docs:update');
} else {
  console.log('README provider table is current.');
}
