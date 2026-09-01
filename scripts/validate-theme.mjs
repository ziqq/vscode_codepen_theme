import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { generatedThemes } = require('../src/index.js');
const { runtimeFiles } = require('../src/build-runtime.js');
const { themeVariants } = require('../src/theme-variants.js');

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const recommendations = JSON.parse(
  await readFile('.vscode/extensions.json', 'utf8'),
);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const languageSupport = await readFile('docs/language-support.md', 'utf8');

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

const sampleEntries = await readdir('samples', {
  recursive: true,
  withFileTypes: true,
});
const actualSamples = sampleEntries
  .filter((entry) => entry.isFile())
  .map((entry) => path.relative(
    process.cwd(),
    path.join(entry.parentPath ?? entry.path, entry.name),
  ).split(path.sep).join('/'))
  .filter((samplePath) =>
    samplePath !== 'samples/README.md' &&
    !samplePath.startsWith('samples/.vscode/'))
  .sort();

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
const typographyDefaults = manifest.contributes.configurationDefaults;
const expectedTypographyKeys = [
  '[Log]',
  'debug.console.fontFamily',
  'debug.console.fontSize',
  'editor.fontFamily',
  'editor.fontLigatures',
  'editor.fontSize',
  'terminal.integrated.fontFamily',
  'terminal.integrated.fontSize',
];
if (!typographyDefaults ||
    JSON.stringify(Object.keys(typographyDefaults).sort()) !==
      JSON.stringify(expectedTypographyKeys)) {
  throw new Error('package.json must be the complete typography-default source');
}
const logDefaults = typographyDefaults['[Log]'];
if (!logDefaults ||
    JSON.stringify(Object.keys(logDefaults).sort()) !==
      JSON.stringify([
        'editor.fontFamily',
        'editor.fontLigatures',
        'editor.fontSize',
      ])) {
  throw new Error('Output typography must use only the [Log] language override');
}
const fontFamily = typographyDefaults['editor.fontFamily'];
const fontFamilySettings = [
  typographyDefaults['debug.console.fontFamily'],
  typographyDefaults['terminal.integrated.fontFamily'],
  logDefaults['editor.fontFamily'],
];
if (typeof fontFamily !== 'string' ||
    fontFamilySettings.some((value) => value !== fontFamily)) {
  throw new Error('Every contributed surface must share one font-family stack');
}
let previousFontIndex = -1;
for (const family of [
  'Operator Mono Lig',
  'Operator Mono',
  'Monaco',
  'Courier New',
  'Courier',
  'monospace',
]) {
  const index = fontFamily.indexOf(family, previousFontIndex + 1);
  if (index === -1) {
    throw new Error(`Classic CodePen font fallback is missing or reordered: ${family}`);
  }
  previousFontIndex = index;
}
if (typographyDefaults['editor.fontLigatures'] !== true ||
    logDefaults['editor.fontLigatures'] !== true) {
  throw new Error('Editor and Log-language ligatures must default to enabled');
}
for (const [setting, value] of [
  ['debug.console.fontSize', typographyDefaults['debug.console.fontSize']],
  ['editor.fontSize', typographyDefaults['editor.fontSize']],
  ['terminal.integrated.fontSize', typographyDefaults['terminal.integrated.fontSize']],
  ['[Log].editor.fontSize', logDefaults['editor.fontSize']],
]) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${setting} must be a positive number`);
  }
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
const ligatures = parsedThemes.get('CodePen Theme Original Ligatures');
const foregroundRules = (theme) => theme.tokenColors.filter(
  (rule) => rule.settings.foreground !== undefined,
);
const semanticForegrounds = (theme) => Object.fromEntries(
  Object.entries(theme.semanticTokenColors).map(([selector, value]) => [
    selector,
    typeof value === 'string' ? value : value.foreground,
  ]),
);
if (JSON.stringify(original.colors) !== JSON.stringify(ligatures.colors) ||
    JSON.stringify(foregroundRules(original)) !== JSON.stringify(foregroundRules(ligatures)) ||
    JSON.stringify(semanticForegrounds(original)) !== JSON.stringify(semanticForegrounds(ligatures))) {
  throw new Error('Ligatures variant must preserve every Original foreground color');
}
if (original.tokenColors.some((rule) =>
  rule.settings.fontStyle?.split(/\s+/).includes('italic')) ||
  Object.values(original.semanticTokenColors).some((value) =>
    typeof value === 'object' && value.italic === true)) {
  throw new Error('Original must not contribute italic typography');
}
if (!ligatures.tokenColors.some((rule) =>
  rule.settings.fontStyle?.split(/\s+/).includes('italic')) ||
  !Object.values(ligatures.semanticTokenColors).some((value) =>
    typeof value === 'object' && value.italic === true)) {
  throw new Error('Ligatures must retain TextMate and semantic italics');
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
  if (!languageSupport.toLowerCase().includes(extensionId.toLowerCase())) {
    throw new Error(
      `Language support does not document recommended extension ${extensionId}`,
    );
  }
}

for (const samplePath of expectedSamples) {
  await access(samplePath, constants.R_OK);
}

if (new Set(expectedSamples).size !== expectedSamples.length) {
  throw new Error('Every compatibility case must reference a unique sample');
}

const declaredSamples = [...expectedSamples].sort();
if (JSON.stringify(actualSamples) !== JSON.stringify(declaredSamples)) {
  const undeclared = actualSamples.filter((item) => !declaredSamples.includes(item));
  const missing = declaredSamples.filter((item) => !actualSamples.includes(item));
  throw new Error([
    'Every sample source must be declared exactly once in compatibility/scopes.json.',
    undeclared.length > 0 ? `Undeclared: ${undeclared.join(', ')}` : '',
    missing.length > 0 ? `Missing: ${missing.join(', ')}` : '',
  ].filter(Boolean).join(' '));
}

console.log(
  'CodePen Theme sources, generated theme, manifest, and recommendations are consistent.',
);
