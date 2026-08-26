import { execFile } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { vscodeExecutable } from './lib/vscode-runtime.mjs';

const execFileAsync = promisify(execFile);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const versions = process.argv.slice(2);
if (versions.length === 0) {
  versions.push(...compatibility.testVscodeVersions);
}

const vsixPath = path.resolve('build/codepen-theme-original.vsix');
const report = [];
for (const version of [...new Set(versions)]) {
  const executable = await vscodeExecutable(version);
  const userData = await mkdtemp(path.join(os.tmpdir(), 'codepen-user-'));
  const extensions = await mkdtemp(
    path.join(os.tmpdir(), 'codepen-extensions-'),
  );
  try {
    const { stdout, stderr } = await execFileAsync(
      executable,
      [
        '--user-data-dir',
        userData,
        '--extensions-dir',
        extensions,
        '--install-extension',
        vsixPath,
        '--force',
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    const installed = (await readdir(extensions, { withFileTypes: true })).find(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith('ziqq.codepen-theme-original-'),
    );
    if (!installed) {
      throw new Error(`VS Code ${version} did not install the theme`);
    }
    const manifest = JSON.parse(
      await readFile(
        path.join(extensions, installed.name, 'package.json'),
        'utf8',
      ),
    );
    if (Object.keys(manifest.contributes ?? {}).join(',') !== 'themes') {
      throw new Error(`VS Code ${version} installed a non-theme-only manifest`);
    }
    report.push({
      vscode: version,
      extension: `${manifest.publisher}.${manifest.name}@${manifest.version}`,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
    console.log(`VS Code ${version}: theme installation passed.`);
  } finally {
    await rm(userData, { recursive: true, force: true });
    await rm(extensions, { recursive: true, force: true });
  }
}

await writeFile(
  'build/vscode-version-compatibility.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
