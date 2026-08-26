import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const changelog = await readFile('CHANGELOG.md', 'utf8');
const versionPattern = /^\d+\.\d+\.\d+$/;

if (!versionPattern.test(manifest.version)) {
  throw new Error(`Invalid package version ${manifest.version}`);
}

const changelogVersions = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)\s*$/gm)].map(
  (match) => match[1],
);

if (changelogVersions[0] !== manifest.version) {
  throw new Error(
    `First CHANGELOG release must be ${manifest.version}; found ${changelogVersions[0] ?? 'none'}`,
  );
}

if (changelogVersions.filter((version) => version === manifest.version).length !== 1) {
  throw new Error(`CHANGELOG must contain exactly one ${manifest.version} release`);
}

const tag = process.argv[2] ??
  (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined);
if (tag && tag !== `v${manifest.version}`) {
  throw new Error(
    `Release tag ${tag} does not match package version v${manifest.version}`,
  );
}

console.log(
  tag
    ? `Release ${tag} matches package.json and CHANGELOG.md.`
    : `Release metadata is ready for v${manifest.version}.`,
);
