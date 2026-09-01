import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  throw new Error('Usage: node scripts/generate-readme.mjs [--check|--write]');
}

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const guidePath = 'docs/user-guide.md';
const guide = await readFile(guidePath, 'utf8');
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

const start = guide.indexOf(startMarker);
const end = guide.indexOf(endMarker);
if (start === -1 || end === -1 || end < start) {
  throw new Error('User-guide provider table markers are missing or invalid');
}

const expected = `${guide.slice(0, start)}${generated}${guide.slice(
  end + endMarker.length,
)}`;

if (mode === '--write') {
  await writeFile(guidePath, expected);
  console.log('Updated generated user-guide provider table.');
} else if (guide !== expected) {
  throw new Error('User-guide provider table is stale; run npm run docs:update');
} else {
  console.log('User-guide provider table is current.');
}
