import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
} from '@vscode/test-electron';

const execFileAsync = promisify(execFile);

async function existingVscodeExecutable(executable) {
  try {
    await access(executable);
    return executable;
  } catch (error) {
    if (error?.code !== 'ENOENT' || process.platform !== 'darwin' ||
        path.basename(executable) !== 'Electron') {
      throw error;
    }
  }

  // VS Code 1.135 renamed the macOS app binary from Electron to Code before
  // @vscode/test-electron learned the new path. Accept the sibling executable
  // while keeping every caller on the exact downloaded application bundle.
  const renamedExecutable = path.join(path.dirname(executable), 'Code');
  await access(renamedExecutable);
  return renamedExecutable;
}

export async function vscodeExecutable(version) {
  if (process.env.CODEPEN_VSCODE_EXECUTABLE) {
    const executable = await existingVscodeExecutable(
      path.resolve(process.env.CODEPEN_VSCODE_EXECUTABLE),
    );
    const cli = resolveCliPathFromVSCodeExecutablePath(executable);
    const { stdout } = await execFileAsync(cli, ['--version']);
    const actualVersion = stdout.trim().split(/\s+/)[0];
    if (actualVersion !== version) {
      throw new Error(
        `Requested VS Code ${version}, but ${executable} is ${actualVersion}`,
      );
    }
    return executable;
  }
  if (
    process.env.CI !== 'true' &&
    process.env.CODEPEN_ALLOW_VSCODE_DOWNLOAD !== '1'
  ) {
    throw new Error(
      'Refusing to download VS Code outside CI. Use an existing binary via ' +
        'CODEPEN_VSCODE_EXECUTABLE, or explicitly set ' +
        'CODEPEN_ALLOW_VSCODE_DOWNLOAD=1.',
    );
  }
  return existingVscodeExecutable(await downloadAndUnzipVSCode(version));
}

export async function vscodeBuiltinExtensions(executable) {
  const directory = path.dirname(executable);
  const candidates = [
    path.join(directory, 'resources', 'app', 'extensions'),
    path.join(directory, '..', 'Resources', 'app', 'extensions'),
    path.join(directory, '..', 'resources', 'app', 'extensions'),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return path.resolve(candidate);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error(
    `Cannot locate built-in extensions relative to ${executable}`,
  );
}

export async function runVSCode(executable, args, options = {}) {
  return execFileAsync(executable, args, {
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}
