import { mkdir, readFile, writeFile } from 'node:fs/promises';

if (
  process.env.CI !== 'true' &&
  process.env.CODEPEN_ALLOW_PROVIDER_NETWORK !== '1'
) {
  throw new Error(
    'Provider drift checks use the Marketplace network API and run in CI only. ' +
      'Set CODEPEN_ALLOW_PROVIDER_NETWORK=1 to opt in locally.',
  );
}

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const providers = compatibility.providers.filter(
  (provider) => provider.kind === 'recommended',
);
const endpoint =
  'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

const queryProvider = async (id) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json;api-version=7.2-preview.1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filters: [{ criteria: [{ filterType: 7, value: id }] }],
      flags: 529,
    }),
  });
  if (!response.ok) {
    throw new Error(`${id}: Marketplace returned HTTP ${response.status}`);
  }
  const payload = await response.json();
  const extension = payload.results?.[0]?.extensions?.[0];
  const version = extension?.versions?.[0];
  if (!version) {
    throw new Error(`${id}: Marketplace returned no extension version`);
  }
  const engine = version.properties?.find(
    (property) => property.key === 'Microsoft.VisualStudio.Code.Engine',
  )?.value;
  return { version: version.version, engine: engine ?? null };
};

const results = [];
let drifted = false;
for (const provider of providers) {
  const marketplace = await queryProvider(provider.id);
  const differences = [];
  if (marketplace.version !== provider.version) {
    differences.push({
      field: 'version',
      expected: provider.version,
      actual: marketplace.version,
    });
  }
  if (marketplace.engine !== provider.engine) {
    differences.push({
      field: 'engine',
      expected: provider.engine,
      actual: marketplace.engine,
    });
  }
  if (differences.length > 0) drifted = true;
  results.push({
    id: provider.id,
    recorded: { version: provider.version, engine: provider.engine },
    marketplace,
    differences,
  });
  console.log(`${provider.id}: ${differences.length === 0 ? 'current' : 'drift detected'}.`);
}

await mkdir('build', { recursive: true });
await writeFile(
  'build/provider-drift.json',
  `${JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)}\n`,
);
if (drifted) {
  throw new Error('Provider metadata drift detected; inspect build/provider-drift.json');
}
