import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

// Prisma runs without its Rust query engine, using the `pg` driver directly.
// This keeps serverless bundles small and avoids missing-engine errors on Vercel.
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
