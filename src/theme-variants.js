/**
 * @file Canonical public variant labels, output filenames, and typography flags.
 * Generation, activation, and validation consume the same immutable metadata.
 */

/**
 * @typedef {object} ThemeVariant
 * @property {string} id Stable internal variant identifier.
 * @property {string} label Public VS Code theme label; activation matches it exactly.
 * @property {string} file Generated color-theme filename relative to themes/.
 * @property {boolean} italics Whether the general italic syntax layer is retained.
 */

/**
 * Public theme variants live in one place so the manifest, generator,
 * refinement runtime, and validators cannot drift onto different labels.
 */
/** @type {ReadonlyArray<Readonly<ThemeVariant>>} */
const themeVariants = Object.freeze([
  Object.freeze({
    id: 'original',
    label: 'CodePen Theme Original',
    file: 'codepen-theme.json',
    italics: false,
  }),
  Object.freeze({
    id: 'italics',
    label: 'CodePen Theme Original Italics',
    file: 'codepen-theme-italics.json',
    italics: true,
  }),
]);

module.exports = { themeVariants };
