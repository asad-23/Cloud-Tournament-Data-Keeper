import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { PORT } from './env';
import { prisma } from './prisma';
import { HttpError } from './lib/http';
import authRoutes from './routes/auth';
import tournamentRoutes from './routes/tournaments';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues[0]?.message ?? 'Invalid input',
      details: err.issues,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

export default app;

// Vercel imports the app as a serverless function, so only listen when running
// as a normal long-lived server (local dev, Docker, Render, Railway, ...).
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on http://0.0.0.0:${PORT}`);
  });

  async function shutdown() {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
