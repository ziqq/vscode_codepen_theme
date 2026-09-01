/**
 * Public theme variants live in one place so the manifest, generator,
 * refinement runtime, and validators cannot drift onto different labels.
 */
const themeVariants = Object.freeze([
  Object.freeze({
    id: 'original',
    label: 'CodePen Theme Original',
    file: 'codepen-theme.json',
    italics: true,
  }),
  Object.freeze({
    id: 'upright',
    label: 'CodePen Theme Original Upright',
    file: 'codepen-theme-upright.json',
    italics: false,
  }),
]);

/**
 * Classic CodePen kept the Twilight palette independent from its editor-font
 * preference. Its original system-font option used Monaco/Courier at 13 px;
 * use the same portable stack for every VS Code text surface.
 */
const typographyDefaults = Object.freeze({
  'debug.console.fontFamily': "Monaco, 'Courier New', Courier, monospace",
  'debug.console.fontSize': 13,
  'editor.fontFamily': "Monaco, 'Courier New', Courier, monospace",
  'editor.fontSize': 13,
  'terminal.integrated.fontFamily':
    "Monaco, 'Courier New', Courier, monospace",
  'terminal.integrated.fontSize': 13,
  '[Log]': {
    'editor.fontFamily': "Monaco, 'Courier New', Courier, monospace",
    'editor.fontSize': 13,
  },
});

module.exports = { themeVariants, typographyDefaults };
