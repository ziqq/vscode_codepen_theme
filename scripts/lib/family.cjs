// Selects the theme family whose fixtures a family-scoped check validates.
// `npm run check` runs every family; set CODEPEN_THEME_FAMILY for one.
const { themeFamilies, themeVariants } = require('../../src/theme-variants.js');

const family = process.env.CODEPEN_THEME_FAMILY ?? 'original';
if (!themeFamilies.includes(family)) {
  throw new Error(`Unknown CODEPEN_THEME_FAMILY ${family}; expected ${themeFamilies.join(' or ')}`);
}
const variants = themeVariants.filter((variant) => variant.family === family);
const baseVariant = variants.find((variant) => !variant.italics);
const italicsVariant = variants.find((variant) => variant.italics);

module.exports = {
  family,
  themeFamilies,
  themeVariants,
  baseVariant,
  italicsVariant,
  baseThemePath: `themes/${baseVariant.file}`,
  italicsThemePath: `themes/${italicsVariant.file}`,
  fixturePath: (name) => `compatibility/${family}/${name}`,
  runtimeRefinePath: require('node:path').resolve(__dirname, '../../runtime', family, 'refine.js'),
};
