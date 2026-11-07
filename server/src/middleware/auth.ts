import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../lib/http';

export interface AuthUser {
  id: string;
  nickname: string;
  firstName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  return prisma.user.findUnique({
    where: { token },
    select: { id: true, nickname: true, firstName: true },
  });
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await resolveUser(req);
    if (!user) throw new HttpError(401, 'Invalid or missing authentication token');
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Attaches the user when a valid token is present, but never blocks the request. */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.user = (await resolveUser(req)) ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
}
