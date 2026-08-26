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

  await vscode.workspace.getConfiguration('workbench').update(
    'colorTheme',
    'CodePen Theme Original',
    vscode.ConfigurationTarget.Global,
  );
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
