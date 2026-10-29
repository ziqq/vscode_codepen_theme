/**
 * Public theme variants live in one place so the manifest, generator,
 * refinement runtime, and validators cannot drift onto different labels.
 * A family owns its theme generator, refinement classifiers, and fixtures;
 * the Italics variant of a family only adds theme-owned italics.
 */
const themeFamilies = Object.freeze(['original', 'custom']);

const themeVariants = Object.freeze([
  Object.freeze({
    id: 'original',
    family: 'original',
    label: 'CodePen Theme Original',
    file: 'codepen-theme.json',
    italics: false,
  }),
  Object.freeze({
    id: 'original-italics',
    family: 'original',
    label: 'CodePen Theme Original Italics',
    file: 'codepen-theme-italics.json',
    italics: true,
  }),
  Object.freeze({
    id: 'custom',
    family: 'custom',
    label: 'CodePen Theme Custom',
    file: 'codepen-theme-custom.json',
    italics: false,
  }),
  Object.freeze({
    id: 'custom-italics',
    family: 'custom',
    label: 'CodePen Theme Custom Italics',
    file: 'codepen-theme-custom-italics.json',
    italics: true,
  }),
]);

module.exports = { themeFamilies, themeVariants };
