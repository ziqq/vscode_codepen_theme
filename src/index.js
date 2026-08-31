const fs = require('node:fs');
const path = require('node:path');
const resolveTheme = require('./theme');

const outputPath = path.resolve(__dirname, '../themes/codepen-theme.json');
const buildDirectory = path.resolve(__dirname, '../build');

function generateTheme() {
  const theme = resolveTheme({ name: 'CodePen Theme Original' });
  return `${JSON.stringify(theme)}\n`;
}

function build() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(buildDirectory, { recursive: true });
  fs.writeFileSync(outputPath, generateTheme());
}

if (require.main === module) {
  build();
}

module.exports = {
  build,
  generateTheme,
  outputPath,
};
