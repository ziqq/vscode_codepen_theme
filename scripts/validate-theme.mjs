import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { generatedThemes } = require('../src/index.js');
const { runtimeFiles } = require('../src/build-runtime.js');
const { themeVariants, typographyDefaults } = require('../src/theme-variants.js');

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const recommendations = JSON.parse(
  await readFile('.vscode/extensions.json', 'utf8'),
);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const readme = await readFile('README.md', 'utf8');

const expectedContributionPoints = [
  'configuration',
  'configurationDefaults',
  'themes',
];
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
    `CodePen Theme may contribute only themes, typography defaults, and the refinement setting; found: ${actualContributionPoints.join(', ') || 'none'}`,
  );
}

if ('extensionPack' in manifest || 'extensionDependencies' in manifest) {
  throw new Error('Recommended language extensions must remain optional');
}
if (manifest.main !== './runtime/extension.js' ||
    JSON.stringify(manifest.activationEvents) !== JSON.stringify(['onStartupFinished'])) {
  throw new Error('The theme-scoped refinement entry point is missing');
}
const configuration = manifest.contributes.configuration.properties;
if (Object.keys(configuration).join(',') !== 'codepen.syntaxRefinement.enabled' ||
    configuration['codepen.syntaxRefinement.enabled'].default !== true) {
  throw new Error('Only the opt-out syntax refinement setting is allowed');
}
if (JSON.stringify(manifest.contributes.configurationDefaults) !==
    JSON.stringify(typographyDefaults)) {
  throw new Error('Classic CodePen typography defaults are missing or stale');
}
const expectedRuntime = runtimeFiles();
const actualRuntime = (await readdir('runtime', { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile()).map((entry) =>
    path.relative('runtime', path.join(entry.parentPath ?? entry.path, entry.name)).split(path.sep).join('/'));
if (JSON.stringify(actualRuntime.sort()) !== JSON.stringify([...expectedRuntime.keys()].sort())) {
  throw new Error('Runtime has missing or unexpected files; inspect generated runtime/');
}
for (const [name, expected] of expectedRuntime) {
  if (!(await readFile(`runtime/${name}`)).equals(expected)) throw new Error(`Stale runtime/${name}; run npm run build`);
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
if (!Array.isArray(themes) || themes.length !== themeVariants.length) {
  throw new Error(`Expected exactly ${themeVariants.length} contributed color themes`);
}

const expectedThemeContributions = themeVariants.map((variant) => ({
  label: variant.label,
  uiTheme: 'vs-dark',
  path: `./themes/${variant.file}`,
}));
if (JSON.stringify(themes) !== JSON.stringify(expectedThemeContributions)) {
  throw new Error('Theme contributions do not match src/theme-variants.js');
}

const parsedThemes = new Map();
for (const [absolutePath, expectedSource] of generatedThemes()) {
  const sourcePath = path.relative(process.cwd(), absolutePath);
  await access(sourcePath, constants.R_OK);
  const source = await readFile(sourcePath, 'utf8');
  if (source !== expectedSource) {
    throw new Error(`Generated ${sourcePath} is stale; run npm run build`);
  }
  const parsedTheme = JSON.parse(source);
  parsedThemes.set(parsedTheme.name, parsedTheme);
  if (source !== `${JSON.stringify(parsedTheme)}\n`) {
    throw new Error(`${sourcePath} must be minified with one trailing newline`);
  }
  if (parsedTheme.semanticHighlighting !== true) {
    throw new Error(`${parsedTheme.name}: semantic highlighting must be enabled`);
  }
  if (!parsedTheme.semanticTokenColors ||
      Object.keys(parsedTheme.semanticTokenColors).length === 0) {
    throw new Error(`${parsedTheme.name}: semantic colors are missing`);
  }
  for (const key of Object.keys(parsedTheme)) {
    if (key.includes('.font')) {
      throw new Error(`${parsedTheme.name}: ${key} is a setting, not a theme color`);
    }
  }
  for (const [selector, value] of Object.entries(parsedTheme.semanticTokenColors)) {
    const foreground = typeof value === 'string' ? value : value.foreground;
    if (!/^#[0-9a-f]{6}$/i.test(foreground)) {
      throw new Error(`${selector}: semantic rules must use a palette foreground`);
    }
    if (typeof value !== 'string' &&
        (!['keyword:dart', 'keyword.void:dart'].includes(selector) ||
         Object.keys(value).sort().join(',') !== 'foreground,italic')) {
      throw new Error(`${selector}: unexpected semantic typography override`);
    }
  }
}

const original = parsedThemes.get('CodePen Theme Original');
const upright = parsedThemes.get('CodePen Theme Original Upright');
const foregroundRules = (theme) => theme.tokenColors.filter(
  (rule) => rule.settings.foreground !== undefined,
);
const semanticForegrounds = (theme) => Object.fromEntries(
  Object.entries(theme.semanticTokenColors).map(([selector, value]) => [
    selector,
    typeof value === 'string' ? value : value.foreground,
  ]),
);
if (JSON.stringify(original.colors) !== JSON.stringify(upright.colors) ||
    JSON.stringify(foregroundRules(original)) !== JSON.stringify(foregroundRules(upright)) ||
    JSON.stringify(semanticForegrounds(original)) !== JSON.stringify(semanticForegrounds(upright))) {
  throw new Error('Upright variant must preserve every Original foreground color');
}
if (upright.tokenColors.some((rule) =>
  rule.settings.fontStyle?.split(/\s+/).includes('italic')) ||
  Object.values(upright.semanticTokenColors).some((value) =>
    typeof value === 'object' && value.italic === true)) {
  throw new Error('Upright variant must not contribute italic typography');
}

const generatedThemeFiles = await readdir('themes');
if (
  JSON.stringify(generatedThemeFiles.sort()) !==
  JSON.stringify(themeVariants.map((variant) => variant.file).sort())
) {
  throw new Error('themes/ must contain only generated CodePen theme variants');
}

for (const directory of ['languages', 'syntaxes', 'snippets']) {
  try {
    const entries = await readdir(directory, { recursive: true });
    if (entries.length > 0) {
      throw new Error(
        `Language registrations must remain provider-owned; unexpected ./${directory}`,
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
