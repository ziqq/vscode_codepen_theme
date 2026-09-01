import {
  access,
  lstat,
  mkdir,
  readFile,
  readlink,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureRecommendedProviders } from './lib/providers.mjs';
import { vscodeBuiltinExtensions } from './lib/vscode-runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = path.join(root, '.cache', 'codepen-theme', 'preview');
const providerLinks = path.join(previewRoot, 'providers');
const workspace = path.join(previewRoot, 'samples.code-workspace');
const vscodeArgument = process.argv.indexOf('--vscode-executable');

if (vscodeArgument < 0 || !process.argv[vscodeArgument + 1]) {
  throw new Error('Usage: prepare-preview.mjs --vscode-executable <path>');
}

const executable = path.resolve(process.argv[vscodeArgument + 1]);
const builtinExtensions = await vscodeBuiltinExtensions(executable);
const vscodeManifest = JSON.parse(
  await readFile(path.join(builtinExtensions, '..', 'package.json'), 'utf8'),
);
const compatibility = JSON.parse(
  await readFile(path.join(root, 'compatibility', 'scopes.json'), 'utf8'),
);

function extensionId(manifest) {
  return `${manifest.publisher}.${manifest.name}`.toLowerCase();
}

async function assertProvider(extensionRoot, expectedId, expectedVersion) {
  const manifest = JSON.parse(
    await readFile(path.join(extensionRoot, 'package.json'), 'utf8'),
  );
  if (extensionId(manifest) !== expectedId.toLowerCase()) {
    throw new Error(
      `${extensionRoot} contains ${extensionId(manifest)}, expected ${expectedId}`,
    );
  }
  if (manifest.contributes?.themes?.length) {
    throw new Error(`${expectedId} contributes a color theme and cannot enter the preview`);
  }
  if (expectedVersion && manifest.version !== expectedVersion) {
    throw new Error(`${expectedId}@${manifest.version} does not match cached version ${expectedVersion}`);
  }
  return manifest.version;
}

async function replaceGeneratedLink(name, target) {
  const link = path.join(providerLinks, name.toLowerCase());
  try {
    const entry = await lstat(link);
    if (!entry.isSymbolicLink()) {
      throw new Error(`${link} is not a generated symbolic link; refusing to replace it`);
    }
    if (path.resolve(providerLinks, await readlink(link)) === target) {
      return link;
    }
    await unlink(link);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  return link;
}

async function installedDartExtension() {
  if (process.env.CODEPEN_DART_EXTENSION) {
    return path.resolve(process.env.CODEPEN_DART_EXTENSION);
  }
  const indexPath = path.join(os.homedir(), '.vscode', 'extensions', 'extensions.json');
  try {
    const entries = JSON.parse(await readFile(indexPath, 'utf8'));
    const dart = entries
      .filter((entry) => entry.identifier?.id?.toLowerCase() === 'dart-code.dart-code')
      .sort((left, right) => right.version.localeCompare(left.version, undefined, {
        numeric: true,
      }))[0];
    const location = dart?.relativeLocation ?? dart?.location?.path;
    return location ? path.resolve(path.dirname(indexPath), location) : undefined;
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

await mkdir(providerLinks, { recursive: true });

const providers = await ensureRecommendedProviders(
  compatibility,
  vscodeManifest.version,
);
const resolvedProviders = [];
for (const provider of providers) {
  const version = await assertProvider(provider.extensionRoot, provider.provider.id, provider.version);
  const link = await replaceGeneratedLink(provider.provider.id, provider.extensionRoot);
  resolvedProviders.push({
    id: provider.provider.id,
    version,
    source: provider.extensionRoot,
    link,
  });
}

const dartRoot = await installedDartExtension();
let dart;
if (dartRoot) {
  const version = await assertProvider(dartRoot, 'Dart-Code.dart-code');
  const link = await replaceGeneratedLink('dart-code.dart-code', dartRoot);
  dart = { id: 'Dart-Code.dart-code', version, source: dartRoot, link };
} else {
  throw new Error(
    'Dart-Code is required for the semantic preview. Install it in the normal ' +
      'profile or set CODEPEN_DART_EXTENSION to an existing extension directory.',
  );
}

const settings = {
  'extensions.ignoreRecommendations': true,
  'workbench.colorTheme': 'CodePen Theme Original',
  'editor.tokenColorCustomizations': { textMateRules: [] },
};
if (process.env.CODEPEN_DART_SDK) {
  const sdk = path.resolve(process.env.CODEPEN_DART_SDK);
  await access(path.join(sdk, 'bin', process.platform === 'win32' ? 'dart.exe' : 'dart'));
  settings['dart.sdkPath'] = sdk;
}
await writeFile(
  workspace,
  `${JSON.stringify({ folders: [{ path: path.join(root, 'samples') }], settings }, null, 2)}\n`,
);
await writeFile(
  path.join(previewRoot, 'manifest.json'),
  `${JSON.stringify({
    vscodeVersion: vscodeManifest.version,
    theme: root,
    profile: 'temporary empty profile (--profile-temp)',
    workspace,
    providers: resolvedProviders,
    dart,
  }, null, 2)}\n`,
);

console.log(`Prepared isolated CodePen preview for VS Code ${vscodeManifest.version}.`);
console.log(`Theme source: ${root}`);
console.log(`Language providers: ${resolvedProviders.length + 1}`);
