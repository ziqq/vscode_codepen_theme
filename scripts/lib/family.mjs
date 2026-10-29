import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const {
  family,
  themeFamilies,
  themeVariants,
  baseVariant,
  italicsVariant,
  baseThemePath,
  italicsThemePath,
  fixturePath,
  runtimeRefinePath,
} = require('./family.cjs');
