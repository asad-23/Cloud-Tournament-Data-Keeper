import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Loads env files in priority order. dotenv never overrides a value that is
 * already set, so the first file that defines a key wins.
 *
 * - Project root `.env.local` — written by `neon deploy` / `neon env pull`
 * - Project root `.env` — optional project-wide overrides
 * - `server/.env` — local development defaults
 */
const files = [
  resolve(__dirname, '../../.env.local'),
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../.env'),
];

for (const path of files) {
  config({ path });
}
