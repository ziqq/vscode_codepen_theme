import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);

for (const version of compatibility.testVscodeVersions) {
  console.log(`Tokenizing provider matrix for VS Code ${version}.`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/tokenize-providers.mjs', version],
      { stdio: 'inherit', env: process.env },
    );
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });
  if (exitCode !== 0) {
    throw new Error(
      `Provider tokenization failed for VS Code ${version} with exit code ${exitCode}`,
    );
  }
  const semanticExitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/test-semantic-provider.mjs', version],
      { stdio: 'inherit', env: process.env },
    );
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });
  if (semanticExitCode !== 0) {
    throw new Error(`Semantic provider failed for VS Code ${version}`);
  }
  const referenceExitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/audit-codepen-reference.mjs', version],
      { stdio: 'inherit', env: process.env },
    );
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });
  if (referenceExitCode !== 0) {
    throw new Error(`CodePen reference audit failed for VS Code ${version}`);
  }
}
