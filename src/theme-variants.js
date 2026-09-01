/**
 * Public theme variants live in one place so the manifest, generator,
 * refinement runtime, and validators cannot drift onto different labels.
 */
const themeVariants = Object.freeze([
  Object.freeze({
    id: 'original',
    label: 'CodePen Theme Original',
    file: 'codepen-theme.json',
    italics: false,
  }),
  Object.freeze({
    id: 'ligatures',
    label: 'CodePen Theme Original Ligatures',
    file: 'codepen-theme-ligatures.json',
    italics: true,
  }),
]);

module.exports = { themeVariants };
