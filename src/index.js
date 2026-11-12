/**
 * @file Generate public theme JSON and the private parser runtime from owned sources.
 * Requiring this module exposes generation helpers without writing files.
 */

const fs = require('node:fs');
const path = require('node:path');
const resolveTheme = require('./theme');
const { buildRuntime } = require('./build-runtime');
const { themeVariants } = require('./theme-variants');

const themesDirectory = path.resolve(__dirname, '../themes');
const buildDirectory = path.resolve(__dirname, '../build');

/**
 * Serialize one public variant with deterministic JSON and a trailing newline.
 *
 * @param {import('./theme-variants').ThemeVariant} variant Variant metadata; defaults to Original.
 * @returns {string} Minified color-theme file contents.
 */
function generateTheme(variant = themeVariants[0]) {
  const theme = resolveTheme({
    name: variant.label,
    italics: variant.italics,
  });
  return `${JSON.stringify(theme)}\n`;
}

/**
 * Calculate generated theme paths and contents without writing files.
 *
 * @returns {Map<string, string>} Absolute output paths mapped to their expected bytes.
 */
function generatedThemes() {
  return new Map(
    themeVariants.map((variant) => [
      path.join(themesDirectory, variant.file),
      generateTheme(variant),
    ]),
  );
}

/**
 * Regenerate both themes and the private runtime from the same source snapshot.
 *
 * @returns {void} Generated files are written synchronously.
 */
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
