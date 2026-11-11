/**
 * @file Locate exact VS Code versions and their built-in grammars for reproducible checks.
 * Local downloads are opt-in and macOS executable naming is normalized here.
 */

import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
} from '@vscode/test-electron';

const execFileAsync = promisify(execFile);

/**
 * Locate the requested VS Code binary and validate explicit overrides.
 * macOS caches may expose either the historical Electron name or the newer Code name.
 *
 * @throws {Error} When downloads are disallowed, an override has the wrong version, or the binary is absent.
 * @param {string} version Exact editor version required by the test.
 * @returns {Promise<string>} Absolute editor executable path.
 */
export async function vscodeExecutable(version) {
  if (process.env.CODEPEN_VSCODE_EXECUTABLE) {
    const executable = path.resolve(process.env.CODEPEN_VSCODE_EXECUTABLE);
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
  const executable = await downloadAndUnzipVSCode(version);
  if (process.platform === 'darwin' && path.basename(executable) === 'Electron') {
    try {
      await access(executable);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      const code = path.join(path.dirname(executable), 'Code');
      await access(code);
      return code;
    }
  }
  return executable;
}

/**
 * Find built-in language extensions relative to a platform-specific editor binary.
 *
 * @param {string} executable Absolute VS Code executable path.
 * @returns {Promise<string>} Absolute built-in extensions directory.
 */
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

/**
 * Run an editor executable with bounded captured output and caller-supplied process options.
 *
 * @param {string} executable Editor or CLI executable.
 * @param {string[]} args Arguments passed without shell interpolation.
 * @param {import('node:child_process').ExecFileOptions} [options] Child-process overrides.
 * @returns {Promise<{stdout: string | Buffer, stderr: string | Buffer}>} Captured process output.
 */
export async function runVSCode(executable, args, options = {}) {
  return execFileAsync(executable, args, {
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}
