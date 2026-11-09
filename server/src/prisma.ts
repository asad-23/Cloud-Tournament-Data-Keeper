import dns from 'node:dns';
import net from 'node:net';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';

// Some networks advertise IPv6 for Neon hosts but silently drop those
// connections. Prefer IPv4 and skip Happy Eyeballs so `pg` connects directly.
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

// Use Neon's pooled connection for application traffic. On Vercel Fluid
// compute, attachDatabasePool releases idle connections before the function
// is suspended.
const pool = new Pool({ connectionString });

if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

// Prisma runs without its Rust query engine, using the `pg` driver directly.
// This keeps serverless bundles small and avoids missing-engine errors on Vercel.
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
