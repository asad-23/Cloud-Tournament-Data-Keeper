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

const deviceIdSchema = z
  .string()
  .trim()
  .min(8, 'Device identifier is missing')
  .max(128, 'Device identifier is invalid');

const publicUser = (user: { id: string; nickname: string; firstName: string }) => ({
  id: user.id,
  nickname: user.nickname,
  firstName: user.firstName,
});

router.post(
  '/register',
  h(async (req, res) => {
    const { nickname, firstName, deviceId } = z
      .object({
        nickname: nicknameSchema,
        firstName: firstNameSchema,
        deviceId: deviceIdSchema,
      })
      .parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existing) {
      throw new HttpError(409, 'That nickname is already taken');
    }

    // One account per device: this device already owns an account.
    const deviceAccount = await prisma.user.findUnique({
      where: { deviceId },
      select: { nickname: true },
    });
    if (deviceAccount) {
      throw new HttpError(
        409,
        `This device already has the account @${deviceAccount.nickname}. Sign in with it instead.`,
      );
    }

    const token = randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: { nickname, firstName, token, deviceId },
      select: { id: true, nickname: true, firstName: true },
    });

    res.status(201).json({ token, user: publicUser(user) });
  }),
);

/**
 * Lightweight recovery: nickname + first name match re-issues a device token.
 * The account is locked to the device that created it, so nobody can sign in
 * to somebody else's account from a different phone.
 */
router.post(
  '/login',
  h(async (req, res) => {
    const { nickname, firstName, deviceId } = z
      .object({
        nickname: nicknameSchema,
        firstName: firstNameSchema,
        deviceId: deviceIdSchema,
      })
      .parse(req.body);

    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
    });

    if (!user || user.firstName.toLowerCase() !== firstName.toLowerCase()) {
      throw new HttpError(401, 'Nickname and first name do not match');
    }

    if (user.deviceId && user.deviceId !== deviceId) {
      throw new HttpError(
        403,
        'This account belongs to another device. Each device can only use one account.',
      );
    }

    // A legacy (unbound) account can be claimed, but only by a device that does
    // not already own a different account.
    const deviceAccount = await prisma.user.findUnique({
      where: { deviceId },
      select: { id: true },
    });
    if (deviceAccount && deviceAccount.id !== user.id) {
      throw new HttpError(
        409,
        'This device already has an account. Each device can only use one account.',
      );
    }

    const token = randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      // Legacy accounts created before device locking are claimed by this device.
      data: { token, deviceId: user.deviceId ?? deviceId },
    });

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
