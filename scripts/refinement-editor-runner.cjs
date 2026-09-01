const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.run = async () => {
  const output = process.env.CODEPEN_REFINEMENT_OUTPUT;
  const plan = JSON.parse(await fs.readFile(path.join(output, 'plan.json'), 'utf8'));
  const extension = vscode.extensions.getExtension('ziqq.codepen-theme-original');
  assert.equal(await fs.realpath(extension.extensionPath), plan.root);
  const api = await extension.activate();
  const themes = vscode.extensions.all.filter((item) => item.packageJSON.contributes?.themes && !item.id.startsWith('vscode.'));
  assert.deepEqual(themes.map((item) => item.id), ['ziqq.codepen-theme-original']);
  assert.deepEqual(extension.packageJSON.contributes.themes.map((item) => item.label), [
    'CodePen Theme Original',
    'CodePen Theme Original Upright',
  ]);
  const configuration = vscode.workspace.getConfiguration();
  for (const [setting, expected] of Object.entries(plan.typographyDefaults)) {
    assert.deepEqual(configuration.inspect(setting)?.defaultValue, expected,
      `${setting}: contributed default`);
  }
  const outputChannel = vscode.window.createOutputChannel('CodePen Typography Probe');
  outputChannel.appendLine('CODEPEN_OUTPUT_TYPOGRAPHY');
  outputChannel.show(true);
  await wait(300);
  await fs.writeFile(path.join(output, 'output-ready'), '');
  for (;;) {
    try { await fs.access(path.join(output, 'output-ack')); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await wait(50);
  }
  outputChannel.dispose();
  await vscode.commands.executeCommand('workbench.action.closePanel');
  const target = vscode.ConfigurationTarget.Workspace;
  async function idle(document, active) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const state = api.getState();
      assert.equal(state.failures, 0, 'Runtime parser failure');
      const cached = state.documents.find((item) => item.uri === document.uri.toString() && item.version === document.version);
      if (state.pending === 0 && Boolean(cached) === active) return state;
      await wait(50);
    }
    throw new Error(`Refinement did not settle for ${document.languageId}`);
  }
  const environment = { vscodeVersion: vscode.version, theme: extension.extensionPath,
    customThemes: themes.map((item) => item.id), extensions: vscode.extensions.all.filter((item) => !item.id.startsWith('vscode.')).map((item) => item.id) };
  await fs.writeFile(path.join(output, 'environment.json'), JSON.stringify(environment, null, 2));
  for (let index = 0; index < plan.cases.length; index++) {
    const item = plan.cases[index];
    await configuration.update('editor.semanticHighlighting.enabled', item.semantic, target);
    await configuration.update('workbench.colorTheme', item.otherTheme
      ? 'Default Dark Modern'
      : item.upright ? 'CodePen Theme Original Upright' : 'CodePen Theme Original', target);
    await configuration.update('codepen.syntaxRefinement.enabled', !item.disabled, target);
    let document = await vscode.workspace.openTextDocument(item.file);
    if (document.languageId !== item.language) document = await vscode.languages.setTextDocumentLanguage(document, item.language);
    const editor = await vscode.window.showTextDocument(document, { preview: true });
    if (item.edit) {
      for (const text of ['// first edit\n', '// superseded 😀\n', item.source]) {
        await editor.edit((builder) => builder.replace(new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), text));
      }
    }
    editor.revealRange(new vscode.Range(0, 0, 0, 0), vscode.TextEditorRevealType.AtTop);
    if (item.semantic && ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'dart'].includes(item.language)) {
      await vscode.extensions.getExtension(item.language === 'dart' ? 'Dart-Code.dart-code' : 'vscode.typescript-language-features')?.activate();
      const range = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
      const deadline = Date.now() + 30000;
      let tokens;
      while (Date.now() < deadline) {
        tokens = await vscode.commands.executeCommand('vscode.provideDocumentRangeSemanticTokens', document.uri, range);
        if (tokens?.data?.length) break;
        await wait(100);
      }
      assert.ok(tokens?.data?.length, `${item.id}: real semantic provider unavailable`);
      item.semanticTokenCount = tokens.data.length / 5;
    }
    const state = await idle(document, !item.disabled && !item.otherTheme);
    await wait(250);
    await fs.writeFile(path.join(output, `ready-${index}.json`), JSON.stringify({ ...item, state }));
    const deadline = Date.now() + 30000;
    for (;;) {
      try { await fs.access(path.join(output, `ack-${index}`)); break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (Date.now() > deadline) throw new Error(`Screenshot acknowledgment timed out: ${item.id}`);
      await wait(50);
    }
  }
  // Recent desktop builds can keep the main process alive after extension tests
  // finish because the Agent Host owns background resources. This explicit
  // signal lets the capture process distinguish a completed test run from a
  // hung or failed extension host without depending on Electron shutdown.
  await fs.writeFile(path.join(output, 'complete.json'), JSON.stringify({
    vscodeVersion: vscode.version,
    cases: plan.cases.length,
  }));
};
