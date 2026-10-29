import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const files = ['src/build-runtime.js', 'compatibility/original/refinement.cjs', 'compatibility/custom/refinement.cjs',
  ...(await readdir('src/syntax', { recursive: true })).filter((name) => name.endsWith('.js')).map((name) => `src/syntax/${name}`),
  ...(await readdir('scripts')).filter((name) => name.includes('refinement') && /\.(?:cjs|mjs)$/.test(name)).map((name) => `scripts/${name}`),
];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`${files.length} refinement source/test modules passed syntax checks.`);
