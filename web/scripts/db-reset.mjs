// scripts/db-reset.mjs — wipe local D1 state, re-migrate, reseed (dev only).
// Usage: npm run db:reset  (then: npm run kv:seed)
// Local miniflare state is gitignored; production is untouched.
import { rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const dir of ['.wrangler/state/v3/d1', 'workers/sync/.wrangler/state/v3/d1']) {
  rmSync(join(root, dir), { recursive: true, force: true });
  console.log(`wiped ${dir}`);
}
execSync('npm run db:migrate', { cwd: root, stdio: 'inherit' });
execSync('npm run db:seed', { cwd: root, stdio: 'inherit' });
execSync('npx wrangler d1 migrations apply speedbd --local -c workers/sync/wrangler.jsonc', {
  cwd: root,
  stdio: 'inherit',
});
console.log('db-reset: done (run npm run kv:seed next)');
