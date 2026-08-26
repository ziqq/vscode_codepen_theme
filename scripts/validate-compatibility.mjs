import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import {
  compareVersions,
  providerVersionFor,
} from './lib/compatibility.mjs';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const recommendations = JSON.parse(
  await readFile('.vscode/extensions.json', 'utf8'),
);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));

if (compatibility.schemaVersion !== 1) {
  throw new Error('Unsupported compatibility contract schema');
}

if (
  manifest.engines?.vscode !== `^${compatibility.minimumVscodeVersion}`
) {
  throw new Error(
    `engines.vscode must be ^${compatibility.minimumVscodeVersion}`,
  );
}

if (
  !Array.isArray(compatibility.testVscodeVersions) ||
  compatibility.testVscodeVersions.length < 2 ||
  compatibility.testVscodeVersions[0] !== compatibility.minimumVscodeVersion ||
  compatibility.testVscodeVersions.at(-1) !== compatibility.verifiedVscodeVersion
) {
  throw new Error(
    'VS Code test matrix must start at the minimum and end at the verified version',
  );
}
for (let index = 1; index < compatibility.testVscodeVersions.length; index += 1) {
  if (
    compareVersions(
      compatibility.testVscodeVersions[index - 1],
      compatibility.testVscodeVersions[index],
    ) >= 0
  ) {
    throw new Error('VS Code test matrix must be unique and ascending');
  }
}

const providers = new Map();
for (const provider of compatibility.providers) {
  const normalizedId = provider.id.toLowerCase();
  if (providers.has(normalizedId)) {
    throw new Error(`Duplicate provider ${provider.id}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(provider.version)) {
    throw new Error(`Provider ${provider.id} has an invalid version`);
  }
  if (provider.kind === 'recommended') {
    if (!Array.isArray(provider.compatibility) || provider.compatibility.length === 0) {
      throw new Error(`${provider.id} has no VS Code compatibility bands`);
    }
    for (const band of provider.compatibility) {
      if (!/^\d+\.\d+\.\d+$/.test(band.version)) {
        throw new Error(`${provider.id} has an invalid band version`);
      }
    }
    providerVersionFor(provider, compatibility.minimumVscodeVersion);
    for (const vscodeVersion of compatibility.testVscodeVersions) {
      providerVersionFor(provider, vscodeVersion);
    }
    const verifiedVersion = providerVersionFor(
      provider,
      compatibility.verifiedVscodeVersion,
    );
    if (verifiedVersion !== provider.version) {
      throw new Error(
        `${provider.id} verified version ${provider.version} is outside its current compatibility band`,
      );
    }
  }
  providers.set(normalizedId, provider);
}

const expectedRecommendations = compatibility.providers
  .filter((provider) => provider.kind === 'recommended')
  .map((provider) => provider.id);

if (
  JSON.stringify(recommendations.recommendations) !==
  JSON.stringify(expectedRecommendations)
) {
  throw new Error(
    'Workspace recommendations must match recommended compatibility providers',
  );
}

const colorSelectors = theme.tokenColors.flatMap((rule) => {
  if (!rule.settings?.foreground) {
    return [];
  }
  const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
  return scopes.filter(
    (scope) =>
      typeof scope === 'string' &&
      !/[\s,*|]/.test(scope) &&
      scope.length > 0,
  );
});

const isCovered = (scope) =>
  colorSelectors.some(
    (selector) => scope === selector || scope.startsWith(`${selector}.`),
  );

const seenSamples = new Set();
let visualCases = 0;
for (const compatibilityCase of compatibility.cases) {
  if (seenSamples.has(compatibilityCase.sample)) {
    throw new Error(`Duplicate compatibility sample ${compatibilityCase.sample}`);
  }
  seenSamples.add(compatibilityCase.sample);

  if (compatibilityCase.visual !== undefined) {
    if (compatibilityCase.visual !== true) {
      throw new Error(
        `${compatibilityCase.language} visual flag must be true or omitted`,
      );
    }
    visualCases += 1;
  }

  await access(compatibilityCase.sample, constants.R_OK);

  if (!providers.has(compatibilityCase.provider.toLowerCase())) {
    throw new Error(
      `${compatibilityCase.language} references unknown provider ${compatibilityCase.provider}`,
    );
  }

  if (!compatibilityCase.rootScope || !compatibilityCase.languageId) {
    throw new Error(
      `${compatibilityCase.language} must define languageId and rootScope`,
    );
  }

  if (
    !Array.isArray(compatibilityCase.requiredScopes) ||
    compatibilityCase.requiredScopes.length < 4
  ) {
    throw new Error(
      `${compatibilityCase.language} must define at least four representative scopes`,
    );
  }

  for (const scope of compatibilityCase.requiredScopes) {
    if (!isCovered(scope)) {
      throw new Error(
        `${compatibilityCase.language} scope ${scope} has no provider-agnostic theme color`,
      );
    }
  }
}

if (visualCases === 0) {
  throw new Error('Compatibility contract must define visual integration cases');
}

console.log(
  `Compatibility contract covers ${compatibility.cases.length} samples, ${providers.size} providers, and ${visualCases} visual cases.`,
);
