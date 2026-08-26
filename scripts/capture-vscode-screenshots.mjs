import { execFile, spawn } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { resolveCliPathFromVSCodeExecutablePath } from '@vscode/test-electron';
import { chromium } from 'playwright-core';
import pngjs from 'pngjs';
import { ensureRecommendedProviders } from './lib/providers.mjs';
import { vscodeExecutable } from './lib/vscode-runtime.mjs';

const { PNG } = pngjs;
const execFileAsync = promisify(execFile);
const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));
const vscodeVersion = process.argv[2] ?? compatibility.verifiedVscodeVersion;
const visualCases = compatibility.cases.filter((item) => item.visual === true);

if (visualCases.length === 0) {
  throw new Error('No visual compatibility cases are configured');
}

const rgb = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];
const background = rgb(theme.colors['editor.background']);
const tokenPalette = [
  ...new Set(
    theme.tokenColors
      .map((rule) => rule.settings?.foreground)
      .filter((color) => /^#[0-9a-f]{6}$/i.test(color)),
  ),
].map((color) => ({ color, rgb: rgb(color) }));

const freePort = async () => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => server.close((error) => {
    if (error) reject(error);
    else resolve();
  }));
  return address.port;
};

const waitForFile = async (file, timeout = 30_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await access(file);
      return;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${file}`);
};

const waitForWorkbench = async (endpoint) => {
  const deadline = Date.now() + 60_000;
  let lastError;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        if (targets.some((target) => target.type === 'page')) {
          ready = true;
          break;
        }
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) {
    throw new Error(`VS Code workbench did not start: ${lastError}`);
  }
  const browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts()[0];
  if (!context) throw new Error('VS Code debugger exposed no browser context');
  const workbenchDeadline = Date.now() + 30_000;
  let page;
  while (Date.now() < workbenchDeadline && !page) {
    for (const candidate of context.pages()) {
      const workbench = candidate.locator('.monaco-workbench');
      if (await workbench.count() && await workbench.isVisible()) {
        page = candidate;
        break;
      }
    }
    if (!page) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!page) {
    throw new Error('VS Code debugger exposed no workbench page');
  }
  return { browser, context, page };
};

const inspectScreenshot = async (file) => {
  const png = PNG.sync.read(await readFile(file));
  const counts = new Map();
  for (let offset = 0; offset < png.data.length; offset += 4) {
    if (png.data[offset + 3] !== 255) continue;
    const key = `${png.data[offset]},${png.data[offset + 1]},${png.data[offset + 2]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const count = (value) => counts.get(value.join(',')) ?? 0;
  const countNear = (value, tolerance) => {
    let pixels = 0;
    for (const [key, occurrences] of counts) {
      const candidate = key.split(',').map(Number);
      const distance = Math.sqrt(
        (candidate[0] - value[0]) ** 2 +
          (candidate[1] - value[1]) ** 2 +
          (candidate[2] - value[2]) ** 2,
      );
      if (distance <= tolerance) pixels += occurrences;
    }
    return pixels;
  };
  const backgroundPixels = count(background);
  const paletteMatches = tokenPalette
    .map((entry) => ({ color: entry.color, pixels: countNear(entry.rgb, 20) }))
    .filter((entry) => entry.pixels >= 5);
  const minimumBackgroundPixels = Math.floor(png.width * png.height * 0.05);
  if (backgroundPixels < minimumBackgroundPixels) {
    throw new Error(`${file}: CodePen editor background was not rendered`);
  }
  if (paletteMatches.length < 3) {
    throw new Error(
      `${file}: only ${paletteMatches.length} CodePen token colors were rendered`,
    );
  }
  return {
    width: png.width,
    height: png.height,
    backgroundPixels,
    paletteMatches,
  };
};

const executable = await vscodeExecutable(vscodeVersion);
const providers = await ensureRecommendedProviders(
  compatibility,
  vscodeVersion,
);
const runtimeRoot = await mkdtemp(path.join(os.tmpdir(), 'codepen-visual-'));
const installUserData = path.join(runtimeRoot, 'install-user-data');
const userData = path.join(runtimeRoot, 'user-data');
const extensions = path.join(runtimeRoot, 'extensions');
const readyFile = path.join(runtimeRoot, 'ready');
const doneFile = path.join(runtimeRoot, 'done');
const output = path.resolve('build/vscode-screenshots', vscodeVersion);
await mkdir(installUserData, { recursive: true });
await mkdir(path.join(userData, 'User'), { recursive: true });
await mkdir(extensions, { recursive: true });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const vsixPath = path.resolve('build/codepen-theme-original.vsix');
const cli = resolveCliPathFromVSCodeExecutablePath(executable);
const { stdout: installOutput } = await execFileAsync(
  cli,
  [
    '--user-data-dir',
    installUserData,
    '--extensions-dir',
    extensions,
    '--install-extension',
    vsixPath,
    '--force',
  ],
  { maxBuffer: 10 * 1024 * 1024 },
);
if (installOutput.trim()) console.log(installOutput.trim());
const installedTheme = (await readdir(extensions, { withFileTypes: true }))
  .find((entry) => entry.isDirectory() &&
    entry.name.startsWith('ziqq.codepen-theme-original-1.0.0'));
if (!installedTheme) {
  throw new Error('Packaged CodePen theme was not installed for screenshots');
}
const installedThemePath = path.join(extensions, installedTheme.name);

await writeFile(
  path.join(userData, 'User', 'settings.json'),
  `${JSON.stringify({
    'workbench.colorTheme': 'CodePen Theme Original',
    'workbench.startupEditor': 'none',
    'workbench.reduceMotion': 'on',
    'editor.semanticHighlighting.enabled': false,
    'editor.fontFamily': 'monospace',
    'editor.fontSize': 16,
    'editor.lineHeight': 24,
    'editor.minimap.enabled': false,
    'editor.stickyScroll.enabled': false,
    'editor.renderWhitespace': 'none',
    'security.workspace.trust.enabled': false,
    'telemetry.telemetryLevel': 'off',
  }, null, 2)}\n`,
);

for (const provider of providers) {
  const target = path.join(
    extensions,
    `${provider.provider.id}-${provider.version}`.toLowerCase(),
  );
  await symlink(provider.extensionRoot, target, 'dir');
}

const port = await freePort();
const processArgs = [
  ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
  '--new-window',
  '--skip-welcome',
  '--disable-telemetry',
  '--disable-updates',
  '--disable-workspace-trust',
  '--force-device-scale-factor=1',
  '--remote-debugging-address=127.0.0.1',
  `--remote-debugging-port=${port}`,
  '--user-data-dir',
  userData,
  '--extensions-dir',
  extensions,
  `--extensionDevelopmentPath=${installedThemePath}`,
  `--extensionTestsPath=${path.resolve('scripts/vscode-screenshot-runner.cjs')}`,
  path.resolve('.'),
];
const vscode = spawn(executable, processArgs, {
  env: {
    ...process.env,
    CODEPEN_SCREENSHOT_READY: readyFile,
    CODEPEN_SCREENSHOT_DONE: doneFile,
    ELECTRON_ENABLE_LOGGING: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let vscodeLogs = '';
vscode.stdout.on('data', (chunk) => { vscodeLogs += chunk; });
vscode.stderr.on('data', (chunk) => { vscodeLogs += chunk; });

let browser;
try {
  const connected = await waitForWorkbench(`http://127.0.0.1:${port}`);
  browser = connected.browser;
  const { page } = connected;
  await waitForFile(readyFile);
  await page.waitForFunction(
    (expected) => getComputedStyle(document.documentElement)
      .getPropertyValue('--vscode-editor-background')
      .trim()
      .toLowerCase() === expected,
    theme.colors['editor.background'].toLowerCase(),
    { timeout: 20_000 },
  );
  const results = [];
  for (const item of visualCases) {
    const source = await readFile(item.sample, 'utf8');
    const visibleNeedle = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length >= 8);
    if (!visibleNeedle) {
      throw new Error(`${item.sample}: no stable visible line for screenshot`);
    }
    console.log(`Opening ${item.sample}.`);
    await page.keyboard.press(
      process.platform === 'darwin' ? 'Meta+P' : 'Control+P',
    );
    const input = page.locator('.quick-input-widget input');
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.fill(item.sample);
    const result = page
      .locator('.quick-input-list .monaco-list-row')
      .filter({ hasText: path.basename(item.sample) })
      .first();
    await result.waitFor({ state: 'visible', timeout: 20_000 });
    await result.click();
    const sampleTab = page
      .locator('.tabs-container [role="tab"]')
      .filter({ hasText: path.basename(item.sample) })
      .last();
    const focusSample = async () => {
      try {
        await sampleTab.click({ force: true, timeout: 2_000 });
      } catch (error) {
        if (error?.name !== 'TimeoutError') throw error;
      }
    };
    const waitForSample = async () => page.waitForFunction(
      (needle) => {
        const normalizedNeedle = needle.replaceAll(/\s+/g, ' ').trim();
        return [...document.querySelectorAll('.part.editor .view-lines')]
          .some((element) => element.textContent
            ?.replaceAll(/\s+/g, ' ')
            .trim()
            .includes(normalizedNeedle));
      },
      visibleNeedle,
      { timeout: 20_000 },
    );
    await page.waitForTimeout(2_000);
    await focusSample();
    await page.locator('.part.editor .monaco-editor').last().waitFor({
      state: 'visible',
      timeout: 20_000,
    });
    await waitForSample();
    await page.waitForTimeout(2_000);
    await focusSample();
    await waitForSample();
    const file = path.join(
      output,
      `${item.languageId.replaceAll(/[^a-z0-9.-]/gi, '-')}.png`,
    );
    const editorBounds = await page.locator('.part.editor').boundingBox();
    if (!editorBounds) {
      throw new Error(`${item.sample}: editor bounds are unavailable`);
    }
    await page.screenshot({ path: file, clip: editorBounds });
    results.push({
      language: item.language,
      sample: item.sample,
      provider: item.provider,
      screenshot: path.relative('.', file),
      ...(await inspectScreenshot(file)),
    });
    console.log(`${item.language}: captured ${path.relative('.', file)}.`);
  }
  await writeFile(
    path.join(output, 'report.json'),
    `${JSON.stringify({ vscodeVersion, results }, null, 2)}\n`,
  );
} catch (error) {
  await writeFile(path.join(output, 'vscode.log'), vscodeLogs);
  if (vscodeLogs.trim()) console.error(vscodeLogs.trim());
  if (browser) {
    const debugPages = [];
    for (const [index, page] of browser.contexts()[0].pages().entries()) {
      debugPages.push({
        url: page.url(),
        tabs: await page
          .locator('.tabs-container [role="tab"]')
          .evaluateAll((elements) => elements.map((element) => ({
            ariaLabel: element.getAttribute('aria-label'),
            text: element.textContent,
          }))),
        editorText: await page
          .locator('.part.editor .view-lines')
          .allTextContents(),
      });
      await page.screenshot({
        path: path.join(output, `failure-${index}.png`),
      });
    }
    await writeFile(
      path.join(output, 'failure.json'),
      `${JSON.stringify({ error: String(error), pages: debugPages }, null, 2)}\n`,
    );
  }
  throw error;
} finally {
  await writeFile(doneFile, '');
  await browser?.close();
  vscode.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => vscode.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (vscode.exitCode === null) vscode.kill('SIGKILL');
  await rm(runtimeRoot, { recursive: true, force: true });
}
