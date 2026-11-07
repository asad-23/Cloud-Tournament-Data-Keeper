import 'dotenv/config';

export const PORT = Number(process.env.PORT ?? 4000);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}
