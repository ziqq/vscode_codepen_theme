/**
 * @file Prepare verified language-provider VSIX caches for compatibility and preview tools.
 * Local network downloads require explicit opt-in and completed cache markers.
 */

/**
 * @typedef {object} CachedProvider
 * @property {import('./compatibility.mjs').Provider} provider Original contract entry.
 * @property {string} version Selected exact provider version.
 * @property {string} extensionRoot Verified unpacked extension directory.
 * @property {boolean} cached Whether an existing completed cache supplied the provider.
 */

import { execFile } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import {
  access,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { providerVersionFor } from './compatibility.mjs';

const execFileAsync = promisify(execFile);
const defaultCacheRoot = '.cache/codepen-theme/providers';

/**
 * Normalize provider IDs into cache-directory-safe names.
 * @type {(value: string) => string}
 */
const safeName = (value) => value.toLowerCase().replaceAll(/[^a-z0-9.-]/g, '-');

/**
 * Reuse a completed provider cache or download its exact pinned VSIX.
 * Local downloads require explicit opt-in; a completion marker is written only after version checks.
 *
 * @param {import('./compatibility.mjs').Provider} provider Recommended provider from the compatibility contract.
 * @param {string} vscodeVersion Target editor version used to choose the provider band.
 * @returns {Promise<CachedProvider>} Verified unpacked provider metadata.
 */
export async function ensureProvider(provider, vscodeVersion) {
  const version = providerVersionFor(provider, vscodeVersion);
  const cacheRoot = path.resolve(
    process.env.CODEPEN_PROVIDER_CACHE ?? defaultCacheRoot,
  );
  const target = path.join(cacheRoot, `${safeName(provider.id)}-${version}`);
  const extensionRoot = path.join(target, 'extension');
  const marker = path.join(target, '.complete');

  try {
    await access(marker);
    return { provider, version, extensionRoot, cached: true };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  if (
    process.env.CI !== 'true' &&
    process.env.CODEPEN_ALLOW_PROVIDER_DOWNLOAD !== '1'
  ) {
    throw new Error(
      `Provider ${provider.id}@${version} is not cached. Refusing to download ` +
        'it outside CI; set CODEPEN_ALLOW_PROVIDER_DOWNLOAD=1 explicitly.',
    );
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  const separator = provider.id.indexOf('.');
  const publisher = provider.id.slice(0, separator);
  const extensionName = provider.id.slice(separator + 1);
  const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(publisher)}/vsextensions/${encodeURIComponent(extensionName)}/${encodeURIComponent(version)}/vspackage`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Cannot download ${provider.id}@${version}: HTTP ${response.status}`,
    );
  }
  let archive = Buffer.from(await response.arrayBuffer());
  if (archive[0] === 0x1f && archive[1] === 0x8b) {
    archive = gunzipSync(archive);
  }
  const archivePath = path.join(target, 'provider.vsix');
  await writeFile(archivePath, archive);
  await execFileAsync('unzip', ['-q', archivePath, '-d', target]);
  const manifest = JSON.parse(
    await readFile(path.join(extensionRoot, 'package.json'), 'utf8'),
  );
  if (manifest.version !== version) {
    throw new Error(
      `${provider.id} archive version ${manifest.version} does not match ${version}`,
    );
  }
  await writeFile(marker, `${provider.id}@${version}\n`);
  return { provider, version, extensionRoot, cached: false };
}

/**
 * Prepare recommended grammars in contract order for one editor version.
 *
 * @param {{providers: import('./compatibility.mjs').Provider[]}} compatibility Provider contract.
 * @param {string} vscodeVersion Exact editor version under test.
 * @returns {Promise<CachedProvider[]>} Cached or downloaded recommended providers.
 */
export async function ensureRecommendedProviders(
  compatibility,
  vscodeVersion,
) {
  const providers = compatibility.providers.filter(
    (provider) => provider.kind === 'recommended',
  );
  const results = [];
  for (const provider of providers) {
    results.push(await ensureProvider(provider, vscodeVersion));
  }
  return results;
}
