// Token-color expectations are family-owned: both families share the palette
// and providers but map syntax roles differently.
import { family } from './lib/family.mjs';

await import(`./token-colors/${family}.mjs`);
