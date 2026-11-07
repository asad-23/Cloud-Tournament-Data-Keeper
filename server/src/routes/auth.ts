import { Router } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '../prisma';
import { HttpError } from '../lib/http';
import { requireAuth } from '../middleware/auth';

const router = Router();

const h =
  (fn: (req: any, res: any) => Promise<unknown>) =>
  (req: any, res: any, next: any) =>
    fn(req, res).catch(next);

const nicknameSchema = z
  .string()
  .trim()
  .min(3, 'Nickname must be at least 3 characters')
  .max(20, 'Nickname must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Nickname can only use letters, numbers and underscores');

const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'First name is required')
  .max(30, 'First name is too long');

const publicUser = (user: { id: string; nickname: string; firstName: string }) => ({
  id: user.id,
  nickname: user.nickname,
  firstName: user.firstName,
});

router.post(
  '/register',
  h(async (req, res) => {
    const { nickname, firstName } = z
      .object({ nickname: nicknameSchema, firstName: firstNameSchema })
      .parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existing) {
      throw new HttpError(409, 'That nickname is already taken');
    }

    const token = randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: { nickname, firstName, token },
      select: { id: true, nickname: true, firstName: true },
    });

    res.status(201).json({ token, user: publicUser(user) });
  }),
);

/**
 * Lightweight recovery: nickname + first name match re-issues a device token.
 * There are no passwords in this app, so this is intentionally simple.
 */
router.post(
  '/login',
  h(async (req, res) => {
    const { nickname, firstName } = z
      .object({ nickname: nicknameSchema, firstName: firstNameSchema })
      .parse(req.body);

    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
    });

    if (!user || user.firstName.toLowerCase() !== firstName.toLowerCase()) {
      throw new HttpError(401, 'Nickname and first name do not match');
    }

    const token = randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { token } });

    res.json({ token, user: publicUser(user) });
  }),
);

router.get(
  '/me',
  requireAuth,
  h(async (req, res) => {
    res.json({ user: publicUser(req.user!) });
  }),
);

export default router;
