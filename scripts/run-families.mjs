// Runs one family-scoped check for every theme family, e.g.
// `node scripts/run-families.mjs scripts/validate-token-colors.mjs`.
import { spawnSync } from 'node:child_process';
import { themeFamilies } from './lib/family.mjs';

const [script, ...args] = process.argv.slice(2);
if (!script) throw new Error('Usage: node scripts/run-families.mjs <script> [...args]');
for (const family of themeFamilies) {
  console.log(`\n[${family}] ${script} ${args.join(' ')}`.trimEnd());
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: 'inherit',
    env: { ...process.env, CODEPEN_THEME_FAMILY: family },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
