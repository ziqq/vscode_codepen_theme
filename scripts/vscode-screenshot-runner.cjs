const { access, writeFile } = require('node:fs/promises');
const vscode = require('vscode');

const wait = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

exports.run = async () => {
  const readyFile = process.env.CODEPEN_SCREENSHOT_READY;
  const doneFile = process.env.CODEPEN_SCREENSHOT_DONE;
  if (!readyFile || !doneFile) {
    throw new Error('Screenshot control files are not configured');
  }

  const theme = vscode.extensions.getExtension('ziqq.codepen-theme-original');
  if (!theme) {
    throw new Error('The installed CodePen theme is not registered in VS Code');
  }
  // Activate explicitly so semantic screenshots exercise the packaged
  // refinement layer instead of depending on onStartupFinished timing.
  await theme.activate();

  for (const expected of JSON.parse(process.env.CODEPEN_SCREENSHOT_EXPECTATIONS)) {
    if (!expected.provider.startsWith('vscode.') && !vscode.extensions.getExtension(expected.provider)) {
      throw new Error(`Expected language provider is not registered: ${expected.provider}`);
    }
    const document = await vscode.workspace.openTextDocument(expected.file);
    if (document.languageId !== expected.languageId) {
      throw new Error(`${expected.file}: expected ${expected.languageId}, got ${document.languageId}`);
    }
  }

  if (process.env.CODEPEN_SCREENSHOT_SEMANTIC === '1') {
    await vscode.extensions.getExtension('vscode.typescript-language-features')?.activate();
    if (process.env.CODEPEN_DART_SDK) {
      const dart = vscode.extensions.getExtension('Dart-Code.dart-code');
      if (!dart) throw new Error('Dart-Code semantic provider is not registered');
      await dart.activate();
    }
    const results = [];
    const dartErrors = [];
    for (const file of JSON.parse(process.env.CODEPEN_SCREENSHOT_SAMPLES)) {
      const document = await vscode.workspace.openTextDocument(file);
      const range = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
      const semanticDeadline = Date.now() + 45_000;
      let tokens;
      let legend;
      while (Date.now() < semanticDeadline) {
        legend = await vscode.commands.executeCommand('vscode.provideDocumentRangeSemanticTokensLegend', document.uri, range);
        tokens = await vscode.commands.executeCommand('vscode.provideDocumentRangeSemanticTokens', document.uri, range);
        if (tokens?.data.length > 0 && legend) break;
        await wait(200);
      }
      if (!legend || !tokens?.data.length) {
        throw new Error(`Semantic tokens were not provided for ${file}`);
      }
      const decoded = [];
      let line = 0;
      let character = 0;
      for (let index = 0; index < tokens.data.length; index += 5) {
        const [deltaLine, deltaCharacter, length, type, modifiers] = tokens.data.slice(index, index + 5);
        line += deltaLine;
        character = deltaLine ? deltaCharacter : character + deltaCharacter;
        decoded.push({ line: line + 1, character, text: document.lineAt(line).text.slice(character, character + length),
          type: legend.tokenTypes[type], modifiers: legend.tokenModifiers.filter((_, bit) => modifiers & (1 << bit)) });
      }
      if (document.languageId === 'dart') {
        const { readFile } = require('node:fs/promises');
        const { semanticColor } = await import('./lib/token-colors.mjs');
        const expectations = JSON.parse(await readFile(`${__dirname}/../compatibility/dart-semantic.json`, 'utf8'));
        const colors = JSON.parse(await readFile(`${theme.extensionPath}/themes/codepen-theme.json`, 'utf8'));
        for (const expected of expectations.expect) {
          const token = decoded.find((item) => item.line === expected.line && item.text === expected.text);
          if (!token) {
            dartErrors.push(`Missing Dart semantic token ${expected.line}:${expected.text}`);
            continue;
          }
          if (token.type !== expected.type) {
            dartErrors.push(`${expected.line}:${expected.text}: semantic type ${token.type}, expected ${expected.type}`);
          }
          const actualModifiers = [...token.modifiers].sort();
          const expectedModifiers = [...expected.modifiers].sort();
          if (JSON.stringify(actualModifiers) !== JSON.stringify(expectedModifiers)) {
            dartErrors.push(`${expected.line}:${expected.text}: modifiers ${JSON.stringify(actualModifiers)}, expected ${JSON.stringify(expectedModifiers)}`);
          }
          const foreground = semanticColor(colors, token.type, token.modifiers, 'dart');
          if (foreground !== expected.foreground) {
            dartErrors.push(`${expected.line}:${expected.text}: foreground ${foreground}, expected ${expected.foreground}`);
          }
        }
      }
      results.push({ file, language: document.languageId, tokens: tokens.data.length / 5,
        types: legend.tokenTypes, modifiers: legend.tokenModifiers, decoded });
    }
    await writeFile(
      process.env.CODEPEN_SEMANTIC_REPORT,
      `${JSON.stringify({ results, dartErrors }, null, 2)}\n`,
    );
  }

  await writeFile(readyFile, '');

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      await access(doneFile);
      return;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await wait(100);
  }
  throw new Error('Screenshot capture did not finish');
};
