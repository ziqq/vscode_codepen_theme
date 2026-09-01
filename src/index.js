const fs = require('node:fs');
const path = require('node:path');
const resolveTheme = require('./theme');
const { buildRuntime } = require('./build-runtime');
const { themeVariants } = require('./theme-variants');

const themesDirectory = path.resolve(__dirname, '../themes');
const buildDirectory = path.resolve(__dirname, '../build');

function generateTheme(variant = themeVariants[0]) {
  const theme = resolveTheme({
    name: variant.label,
    italics: variant.italics,
  });
  return `${JSON.stringify(theme)}\n`;
}

function generatedThemes() {
  return new Map(
    themeVariants.map((variant) => [
      path.join(themesDirectory, variant.file),
      generateTheme(variant),
    ]),
  );
}

function build() {
  console.log('CODEPEN_THEME_BUILD_START');
  fs.mkdirSync(themesDirectory, { recursive: true });
  fs.mkdirSync(buildDirectory, { recursive: true });
  for (const [outputPath, source] of generatedThemes()) {
    fs.writeFileSync(outputPath, source);
    console.log(`CODEPEN_THEME_GENERATED ${outputPath}`);
  }
  buildRuntime();
  console.log(`CODEPEN_THEME_BUILD_READY ${themesDirectory}`);
}

if (require.main === module) {
  build();
}

module.exports = {
  build,
  generateTheme,
  generatedThemes,
  themesDirectory,
};
