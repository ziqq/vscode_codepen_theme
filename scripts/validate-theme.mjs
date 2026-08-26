import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { generateTheme } = require('../src/index.js');

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const recommendations = JSON.parse(
  await readFile('.vscode/extensions.json', 'utf8'),
);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const readme = await readFile('README.md', 'utf8');
const generatedTheme = await readFile('themes/codepen-theme.json', 'utf8');

const expectedContributionPoints = ['themes'];
const actualContributionPoints = Object.keys(manifest.contributes ?? {}).sort();
const expectedRecommendations = compatibility.providers
  .filter((provider) => provider.kind === 'recommended')
  .map((provider) => provider.id);
const expectedSamples = compatibility.cases.map((item) => item.sample);

if (
  JSON.stringify(actualContributionPoints) !==
  JSON.stringify(expectedContributionPoints)
) {
  throw new Error(
    `CodePen Theme must contribute only themes; found: ${actualContributionPoints.join(', ') || 'none'}`,
  );
}

if ('extensionPack' in manifest || 'extensionDependencies' in manifest) {
  throw new Error('Recommended language extensions must remain optional');
}

if (
  JSON.stringify(recommendations.recommendations) !==
  JSON.stringify(expectedRecommendations)
) {
  throw new Error(
    'Language extension recommendations do not match the supported provider set',
  );
}

const themes = manifest.contributes.themes;
if (!Array.isArray(themes) || themes.length !== 1) {
  throw new Error('Expected exactly one contributed color theme');
}

await access(themes[0].path, constants.R_OK);

if (generatedTheme !== generateTheme()) {
  throw new Error('Generated theme is stale; run npm run build');
}

const parsedTheme = JSON.parse(generatedTheme);
if (generatedTheme !== `${JSON.stringify(parsedTheme)}\n`) {
  throw new Error(
    'Generated theme must be minified with a single trailing newline',
  );
}

if (
  'semanticHighlighting' in parsedTheme ||
  'semanticTokenColors' in parsedTheme
) {
  throw new Error('Semantic highlighting is intentionally deferred');
}

const generatedThemeFiles = await readdir('themes');
if (
  JSON.stringify(generatedThemeFiles.sort()) !==
  JSON.stringify(['codepen-theme.json'])
) {
  throw new Error('themes/ must contain only the generated CodePen theme');
}

for (const directory of ['languages', 'syntaxes', 'snippets']) {
  try {
    const entries = await readdir(directory, { recursive: true });
    if (entries.length > 0) {
      throw new Error(
        `Pure theme package must not contain files under ./${directory}`,
      );
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

for (const extensionId of expectedRecommendations) {
  if (!readme.toLowerCase().includes(extensionId.toLowerCase())) {
    throw new Error(
      `README does not document recommended extension ${extensionId}`,
    );
  }
}

for (const samplePath of expectedSamples) {
  await access(samplePath, constants.R_OK);
}

console.log(
  'CodePen Theme sources, generated theme, manifest, and recommendations are consistent.',
);
