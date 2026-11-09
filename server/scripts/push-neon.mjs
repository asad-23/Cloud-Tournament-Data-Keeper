import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(serverDir, '..');

config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.error('DATABASE_URL_UNPOOLED is not set. Run `neon deploy` first.');
  process.exit(1);
}

// Schema changes must use the direct (non-pooled) connection.
const result = spawnSync('npx', ['prisma', 'db', 'push'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_UNPOOLED },
});

process.exit(result.status ?? 1);
