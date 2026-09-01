import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { vscodeExecutable } from './lib/vscode-runtime.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const root = process.cwd();
const manifest = JSON.parse(
  await fs.readFile(path.join(root, 'package.json'), 'utf8'),
);
const typographyDefaults = manifest.contributes?.configurationDefaults;
assert.ok(
  typographyDefaults,
  'package.json must contribute typography defaults for the editor harness',
);
const requestedVersion = process.argv[2] ?? '1.135.0';
const executable = await vscodeExecutable(requestedVersion);
const output = await fs.mkdtemp(path.join(os.tmpdir(), 'codepen-refinement-'));
const preview = JSON.parse(await fs.readFile('.cache/codepen-theme/preview/manifest.json', 'utf8'));
const fixtures = JSON.parse(await fs.readFile('build/refinement.json', 'utf8')).results;
const references = JSON.parse(await fs.readFile('compatibility/codepen-reference.json', 'utf8')).cases;
const reviewed = JSON.parse(await fs.readFile('compatibility/refinement-differences.json', 'utf8')).differences;
const palette = require('../src/colors');
const expandTabs = (line) => {
  let result = '';
  for (const char of line) result += char === '\t' ? ' '.repeat(4 - result.length % 4) : char;
  return result;
};
const cases = [];
for (const [index, fixture] of fixtures.entries()) {
  cases.push({ id: `${fixture.language}-${index}`, ...fixture });
}
for (const reference of references) {
  cases.push({ id: reference.id, language: { javascript: 'javascript', typescript: 'typescript', jsx: 'javascriptreact' }[reference.mode],
    source: reference.source, reference: true, lines: reference.lines });
}
const evidenceCaseIds = new Set([
  cases.find((item) => item.language === 'typescript')?.id,
  cases.find((item) => item.language === 'dart' && item.source.includes('switch (state)'))?.id,
  cases.find((item) => item.language === 'java')?.id,
  cases.find((item) => item.language === 'just')?.id,
  cases.find((item) => item.language === 'makefile')?.id,
]);
const extensions = { javascript: 'js', javascriptreact: 'jsx', typescript: 'ts', typescriptreact: 'tsx', dart: 'dart',
  java: 'java', go: 'go', python: 'py', cpp: 'cpp', c: 'c', csharp: 'cs', kotlin: 'kt', swift: 'swift', ruby: 'rb',
  php: 'php', just: 'just', makefile: 'mk', sql: 'sql', dotenv: 'env', shellscript: 'sh', html: 'html',
  svelte: 'svelte', vue: 'vue', markdown: 'md', sass: 'sass', c4: 'dsl', rust: 'rs' };
const workspace = path.join(output, 'fixtures');
await fs.mkdir(workspace, { recursive: true });
for (const item of cases) {
  const directory = path.join(workspace, item.id);
  await fs.mkdir(directory);
  item.file = path.join(directory, `sample.${extensions[item.language]}`);
  await fs.writeFile(item.file, item.source);
}
const plan = cases.flatMap((item) => [ { ...item, semantic: false }, { ...item, semantic: true } ]);
plan.push(...[
  { disabled: true }, { otherTheme: true }, { ligatures: true }, { edit: true }, {},
].map((mode, index) => ({ ...cases[0], id: `lifecycle-${index}`, semantic: true, ...mode })));
await fs.writeFile(path.join(output, 'plan.json'), JSON.stringify({
  root,
  cases: plan,
  typographyDefaults,
}));
const settings = {
  'workbench.colorTheme': 'CodePen Theme Original', 'workbench.colorCustomizations': {},
  'editor.tokenColorCustomizations': { textMateRules: [] }, 'editor.semanticTokenColorCustomizations': {},
  'editor.semanticHighlighting.enabled': false, 'editor.lineHeight': 21,
  'editor.minimap.enabled': false, 'editor.stickyScroll.enabled': false,
  'editor.tabSize': 4, 'editor.detectIndentation': false,
  'editor.wordWrap': 'off', 'editor.renderWhitespace': 'none', 'editor.colorDecorators': false,
  'editor.bracketPairColorization.enabled': true, 'workbench.startupEditor': 'none',
  'workbench.reduceMotion': 'on', 'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false,
  'extensions.ignoreRecommendations': true, 'telemetry.telemetryLevel': 'off',
  'dotenv.enableAutocloaking': false,
  'go.showWelcome': false, 'go.toolsManagement.checkForUpdates': 'off',
  'vue.welcome.show': false,
  ...(process.env.CODEPEN_DART_SDK ? { 'dart.sdkPath': process.env.CODEPEN_DART_SDK } : {}),
  'dart.allowAnalytics': false, 'dart.checkForSdkUpdates': false,
};
for (const folder of [path.join(output, 'user-data/User'), path.join(workspace, '.vscode'), path.join(output, 'extensions')]) await fs.mkdir(folder, { recursive: true });
await fs.writeFile(path.join(output, 'user-data/User/settings.json'), JSON.stringify(settings));
await fs.writeFile(path.join(workspace, '.vscode/settings.json'), JSON.stringify(settings));
const server = net.createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise((resolve) => server.close(resolve));
const providers = [...preview.providers, ...(preview.dart ? [preview.dart] : [])];
const app = spawn(executable, ['--new-window', '--skip-welcome', '--skip-release-notes', '--disable-telemetry',
  '--disable-updates', '--disable-workspace-trust', '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${port}`,
  '--user-data-dir', path.join(output, 'user-data'), '--extensions-dir', path.join(output, 'extensions'),
  `--extensionDevelopmentPath=${root}`, ...providers.map((item) => `--extensionDevelopmentPath=${item.source}`),
  `--extensionTestsPath=${path.join(root, 'scripts/refinement-editor-runner.cjs')}`, workspace],
{ stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CODEPEN_REFINEMENT_OUTPUT: output } });
let logs = '', exitCode, browser, page, typography, outputTypography;
app.stdout.on('data', (chunk) => { logs += chunk; });
app.stderr.on('data', (chunk) => { logs += chunk; });
app.once('exit', (code) => { exitCode = code; });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
try {
  const endpoint = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try { if ((await fetch(`${endpoint}/json/list`)).ok) break; } catch {}
    if (exitCode !== undefined) throw new Error(`Editor exited ${exitCode}: ${logs}`);
    await wait(150);
  }
  browser = await chromium.connectOverCDP(endpoint);
  while (Date.now() < deadline) {
    for (const candidate of browser.contexts()[0].pages()) if ((await candidate.title()).includes('Extension Development Host')) page = candidate;
    if (page) break;
    await wait(100);
  }
  assert.ok(page, 'No isolated editor window');
  await page.setViewportSize({ width: 1800, height: 1200 });
  const outputDeadline = Date.now() + 30000;
  while (Date.now() < outputDeadline) {
    try { await fs.access(path.join(output, 'output-ready')); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await wait(100);
  }
  const outputLine = page.locator('.part.panel .view-line', {
    hasText: 'CODEPEN_OUTPUT_TYPOGRAPHY',
  });
  await outputLine.waitFor({ timeout: 20000 });
  outputTypography = await outputLine.evaluate((line) => {
    const style = getComputedStyle(line);
    return { fontFamily: style.fontFamily, fontSize: style.fontSize };
  });
  assert.match(outputTypography.fontFamily, /Operator Mono(?: Lig)?|Monaco/,
    `Output must render the contributed font stack: ${outputTypography.fontFamily}`);
  assert.equal(outputTypography.fontSize,
    `${typographyDefaults['[Log]']['editor.fontSize']}px`,
    'Output must render the contributed [Log] font size');
  await fs.writeFile(path.join(output, 'output-ack'), '');
  for (let index = 0; index < plan.length; index++) {
    let ready;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      try { ready = JSON.parse(await fs.readFile(path.join(output, `ready-${index}.json`), 'utf8')); break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (exitCode !== undefined) throw new Error(`Editor exited ${exitCode}: ${logs}`);
      await wait(100);
    }
    assert.ok(ready, `No ready signal for ${index}`);
    await page.waitForFunction((lines) => {
      const rows = [...document.querySelectorAll('.part.editor .view-line')];
      return rows.length === lines.length && rows.every((row, index) =>
        row.textContent.replaceAll('\u00a0', ' ').replaceAll('\u200b', '') === lines[index]);
    }, ready.source.split(/\r?\n/).map(expandTabs), { timeout: 20000 });
    if (index === 0) {
      typography = await page.locator('.part.editor .view-line').first().evaluate((line) => {
        const style = getComputedStyle(line);
        return { fontFamily: style.fontFamily, fontSize: style.fontSize };
      });
      assert.match(typography.fontFamily, /Operator Mono(?: Lig)?|Monaco/,
        `Editor must render the contributed font stack: ${typography.fontFamily}`);
      assert.equal(typography.fontSize,
        `${typographyDefaults['editor.fontSize']}px`,
        'Editor must render the contributed font size');
    }
    const rendered = await page.locator('.part.editor .view-line').evaluateAll((elements) => {
      const probe = document.createElement('span');
      probe.style.position = 'fixed'; probe.style.visibility = 'hidden';
      document.body.append(probe);
      const normalizeColor = (value) => {
        probe.style.color = value;
        return getComputedStyle(probe).color;
      };
      const rows = elements.map((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const spans = [];
      while (walker.nextNode()) {
        const node = walker.currentNode, style = getComputedStyle(node.parentElement);
        spans.push({ text: node.textContent.replaceAll('\u00a0', ' ').replaceAll('\u200b', ''), color: normalizeColor(style.color), fontStyle: style.fontStyle });
      }
      return { text: spans.map((span) => span.text).join(''), spans };
      });
      probe.remove();
      return rows;
    });
    const result = { ...ready, rendered, errors: [] };
    const sourceLines = ready.source.split(/\r?\n/);
    assert.equal(rendered.length, sourceLines.length, `${ready.id}: visible line count`);
    const colors = [];
    const fontStyles = [];
    for (const [line, row] of rendered.entries()) {
      assert.equal(row.text, expandTabs(sourceLines[line]), `${ready.id}: visible source differs at ${line + 1}`);
      const rowColors = [];
      const rowStyles = [];
      for (const span of row.spans) {
        const channels = span.color.match(/\d+(?:\.\d+)?/g);
        assert.ok(channels?.length >= 3,
          `${ready.id}: unsupported computed color ${JSON.stringify(span.color)}`);
        const rgb = channels.slice(0, 3).map(Number);
        const hex = `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
        for (let char = 0; char < span.text.length; char++) { rowColors.push(hex); rowStyles.push(span.fontStyle); }
      }
      let column = 0;
      for (let char = 0; char < sourceLines[line].length; char++) {
        colors.push(rowColors[column]);
        fontStyles.push(rowStyles[column]);
        column += sourceLines[line][char] === '\t' ? 4 - column % 4 : 1;
      }
      if (line < sourceLines.length - 1) {
        if (ready.source.includes('\r\n')) { colors.push(undefined); fontStyles.push(undefined); }
        colors.push(undefined); fontStyles.push(undefined);
      }
    }
    if (!ready.disabled && !ready.otherTheme) {
      const styleChecks = [];
      if (ready.language === 'dart' && ready.source.includes('Function')) styleChecks.push({ text: 'Function', style: 'normal' });
      if (ready.language === 'dart' && ready.source.startsWith('///')) styleChecks.push({ text: ready.source.split('\n')[0], style: ready.ligatures ? 'italic' : 'normal' });
      if (ready.id === 'typescript-0') styleChecks.push({ text: 'const', style: ready.ligatures ? 'italic' : 'normal' });
      for (const check of styleChecks) {
        const start = ready.source.indexOf(check.text);
        if (fontStyles.slice(start, start + check.text.length).some((style) => style !== check.style)) result.errors.push({ typography: check });
      }
      if (!ready.ligatures && fontStyles.some((style) => style === 'italic')) {
        result.errors.push({ typography: 'Original rendered theme-owned italics' });
      }
      if (ready.ligatures && !fontStyles.some((style) => style === 'italic')) {
        result.errors.push({ typography: 'Ligatures did not render theme-owned italics' });
      }
    }
    if (!ready.disabled && !ready.otherTheme) for (const expected of ready.expectations ?? []) {
      if (colors.slice(expected.start, expected.end).some((color) => color !== palette[expected.role])) {
        result.errors.push({ ...expected, actual: [...new Set(colors.slice(expected.start, expected.end))] });
      }
    }
    if (ready.reference) {
      let offset = 0;
      result.referenceDifferences = [];
      for (const [line, tokens] of ready.lines.entries()) {
        let column = 0;
        for (const [text, , expected] of tokens) {
          if (text.trim() && colors.slice(offset, offset + text.length).some((color) => color !== expected)) {
            const actual = [...new Set(colors.slice(offset, offset + text.length))];
            const difference = { line: line + 1, start: column, text, expected, actual };
            result.referenceDifferences.push(difference);
            const accepted = reviewed.find((item) => item.case === ready.id && item.line === line + 1 && item.start === column && item.text === text);
            if (!accepted || actual.length !== 1 || actual[0] !== accepted.actual) result.errors.push(difference);
          }
          offset += text.length;
          column += text.length;
        }
        offset++;
      }
    }
    if (evidenceCaseIds.has(ready.id) && ready.semantic) {
      await page.screenshot({ path: path.join(output, `${ready.id}.png`), clip: await page.locator('.part.editor').boundingBox() });
    }
    results.push(result);
    await fs.writeFile(path.join(output, 'rendered.json'), JSON.stringify(results, null, 2));
    console.log(`${index + 1}/${plan.length} ${ready.id} semantic=${ready.semantic}: ${result.errors.length} errors${ready.reference ? `, ${result.referenceDifferences.length} reference differences` : ''}`);
    await fs.writeFile(path.join(output, `ack-${index}`), '');
  }
  const completionDeadline = Date.now() + 15000;
  let completion;
  while (Date.now() < completionDeadline) {
    try {
      completion = JSON.parse(await fs.readFile(path.join(output, 'complete.json'), 'utf8'));
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (exitCode !== undefined) break;
    await wait(100);
  }
  assert.deepEqual(completion, { vscodeVersion: requestedVersion, cases: plan.length }, logs);
  if (exitCode !== undefined) assert.equal(exitCode, 0, logs);
  assert.equal(results.flatMap((item) => item.errors).length, 0, 'Rendered refinement assertions failed');
} finally {
  if (exitCode !== 0) await page?.screenshot({ path: path.join(output, 'last-editor.png') }).catch(() => {});
  await fs.writeFile(path.join(output, 'vscode.log'), logs);
  await fs.writeFile('build/refinement-editor.json', JSON.stringify({
    output, typography, outputTypography, results,
  }, null, 2));
  await browser?.close().catch(() => {});
  if (exitCode === undefined) {
    // The isolated desktop process can stay alive after a successful extension
    // test because the Agent Host owns background handles in recent VS Code.
    // The explicit completion marker above is the success boundary; terminate
    // only this disposable test instance and detach its captured streams.
    app.kill('SIGKILL');
    app.stdout.destroy();
    app.stderr.destroy();
    app.unref();
  }
  console.log(`Editor evidence: ${output}`);
}
