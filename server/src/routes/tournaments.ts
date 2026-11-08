import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';
import { generateCode } from '../lib/code';
import { computeStandings } from '../lib/standings';
import { HttpError } from '../lib/http';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

const h =
  (fn: (req: any, res: any) => Promise<unknown>) =>
  (req: any, res: any, next: any) =>
    fn(req, res).catch(next);

const playerNameSchema = z.string().trim().min(1, 'Player name is required').max(30);
const guestNicknameSchema = z
  .string()
  .trim()
  .min(1, 'Nickname is required')
  .max(20, 'Nickname is too long');
const tournamentNameSchema = z.string().trim().min(3, 'Tournament name is too short').max(60);
const scoreSchema = z.number().int().min(0).max(99);

async function uniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateCode();
    const exists = await prisma.tournament.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new HttpError(500, 'Could not generate a unique tournament code');
}

const participantInclude = {
  user: { select: { id: true, nickname: true, firstName: true } },
} satisfies Prisma.ParticipantInclude;

const detailInclude = {
  creator: { select: { id: true, nickname: true, firstName: true } },
  participants: {
    orderBy: { joinedAt: 'asc' },
    include: participantInclude,
  },
  matches: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.TournamentInclude;

function serializeParticipant(p: {
  id: string;
  teamName: string;
  nickname: string | null;
  disabled: boolean;
  joinedAt: Date;
  user: { id: string; nickname: string; firstName: string } | null;
}) {
  return {
    id: p.id,
    teamName: p.teamName,
    nickname: p.nickname,
    disabled: p.disabled,
    joinedAt: p.joinedAt,
    user: p.user,
  };
}

async function requireTournament(id: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) throw new HttpError(404, 'Tournament not found');
  return tournament;
}

async function requireAdmin(id: string, userId: string) {
  const tournament = await requireTournament(id);
  if (tournament.creatorId !== userId) {
    throw new HttpError(403, 'Only the tournament admin can do this');
  }
  return tournament;
}

/**
 * Loads a tournament with the caller's participant row. The admin always
 * passes; everyone else must be an active (not disabled) player.
 */
async function requireActiveMember(id: string, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { participants: { select: { id: true, userId: true, disabled: true } } },
  });
  if (!tournament) throw new HttpError(404, 'Tournament not found');

  const isAdmin = tournament.creatorId === userId;
  const me = tournament.participants.find((p) => p.userId === userId) ?? null;
  if (!isAdmin && (!me || me.disabled)) {
    throw new HttpError(403, 'Only active players in this tournament can do this');
  }

  return { tournament, isAdmin, me };
}

/** Loads a tournament and checks whether the caller may change one match. */
async function requireMatchManager(id: string, matchId: string, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { participants: { select: { id: true, userId: true } } },
  });
  if (!tournament) throw new HttpError(404, 'Tournament not found');

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== tournament.id) {
    throw new HttpError(404, 'Match not found');
  }

  const isAdmin = tournament.creatorId === userId;
  const me = tournament.participants.find((p) => p.userId === userId) ?? null;
  const isMatchPlayer = Boolean(me && (match.homeId === me.id || match.awayId === me.id));
  if (!isAdmin && !isMatchPlayer) {
    throw new HttpError(403, 'Only the two players in this match or the admin can change it');
  }

  return { tournament, match, isAdmin };
}

/** Create a tournament. The creator is the admin and the first player. */
router.post(
  '/',
  requireAuth,
  h(async (req, res) => {
    const body = z
      .object({
        name: tournamentNameSchema,
        teamName: playerNameSchema.optional(),
        description: z.string().trim().max(240).optional(),
        maxPlayers: z.number().int().min(2).max(64).optional(),
      })
      .parse(req.body);

    const playerName = body.teamName ?? req.user!.firstName;
    const code = await uniqueCode();

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        description: body.description,
        code,
        maxPlayers: body.maxPlayers ?? 32,
        status: 'ACTIVE',
        startedAt: new Date(),
        creatorId: req.user!.id,
        participants: {
          create: { userId: req.user!.id, teamName: playerName },
        },
      },
      include: detailInclude,
    });

    res.status(201).json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        code: tournament.code,
        status: tournament.status,
        maxPlayers: tournament.maxPlayers,
        creatorId: tournament.creatorId,
        createdAt: tournament.createdAt,
        creator: tournament.creator,
      },
      participant: serializeParticipant(tournament.participants[0]),
    });
  }),
);

/** Join a tournament with its share code. */
router.post(
  '/join',
  requireAuth,
  h(async (req, res) => {
    const { code, teamName } = z
      .object({
        code: z.string().trim().min(4).max(12),
        teamName: playerNameSchema.optional(),
      })
      .parse(req.body);

    const tournament = await prisma.tournament.findUnique({
      where: { code: code.toUpperCase() },
      include: { participants: true },
    });

    if (!tournament) throw new HttpError(404, 'No tournament found with that code');
    if (tournament.status === 'COMPLETED') {
      throw new HttpError(400, 'This tournament has already finished');
    }

    const alreadyJoined = tournament.participants.some((p) => p.userId === req.user!.id);
    if (alreadyJoined) throw new HttpError(409, 'You are already in this tournament');

    if (tournament.participants.length >= tournament.maxPlayers) {
      throw new HttpError(400, 'This tournament is full');
    }

    const participant = await prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        userId: req.user!.id,
        teamName: teamName ?? req.user!.firstName,
      },
      include: participantInclude,
    });

    res.status(201).json({
      tournament: { id: tournament.id, name: tournament.name, code: tournament.code },
      participant: serializeParticipant(participant),
    });
  }),
);

/** Tournaments the current user is part of. */
router.get(
  '/',
  requireAuth,
  h(async (req, res) => {
    const tournaments = await prisma.tournament.findMany({
      where: { participants: { some: { userId: req.user!.id } } },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, nickname: true } },
        participants: {
          where: { userId: req.user!.id },
          select: { id: true, teamName: true },
        },
        _count: { select: { participants: true, matches: true } },
      },
    });

    res.json({
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        code: t.code,
        status: t.status,
        maxPlayers: t.maxPlayers,
        createdAt: t.createdAt,
        creator: t.creator,
        myTeamName: t.participants[0]?.teamName ?? null,
        participantCount: t._count.participants,
        matchCount: t._count.matches,
      })),
    });
  }),
);

/** Public discovery feed - anyone can browse tournaments. */
router.get(
  '/explore',
  h(async (_req, res) => {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        creator: { select: { id: true, nickname: true } },
        _count: { select: { participants: true, matches: true } },
      },
    });

    res.json({
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        creator: t.creator,
        participantCount: t._count.participants,
        matchCount: t._count.matches,
      })),
    });
  }),
);

/** Public tournament detail with live standings. */
router.get(
  '/:id',
  optionalAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: detailInclude,
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');

    const isMember = req.user
      ? tournament.participants.some((p) => p.userId === req.user!.id)
      : false;

    const { participants, matches, code, ...rest } = tournament;

    res.json({
      tournament: { ...rest, code: isMember ? code : undefined },
      participants: participants.map(serializeParticipant),
      matches,
      standings: computeStandings(participants, matches),
      isMember,
    });
  }),
);

/** Mark the tournament as finished. Admin only. */
router.post(
  '/:id/finish',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    if (tournament.status !== 'ACTIVE') {
      throw new HttpError(400, 'Only an active tournament can be finished');
    }

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    res.json({ ok: true });
  }),
);

/** Rotate the share code. Admin only, while the tournament is active. */
router.post(
  '/:id/code',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    if (tournament.status === 'COMPLETED') {
      throw new HttpError(400, 'The code cannot change after the tournament finishes');
    }

    const code = await uniqueCode();
    await prisma.tournament.update({ where: { id: tournament.id }, data: { code } });

    res.json({ code });
  }),
);

/** Admin adds a player directly (no account needed yet). */
router.post(
  '/:id/participants',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    const body = z
      .object({
        name: playerNameSchema,
        nickname: guestNicknameSchema.optional(),
      })
      .parse(req.body);

    const count = await prisma.participant.count({ where: { tournamentId: tournament.id } });
    if (count >= tournament.maxPlayers) {
      throw new HttpError(400, 'This tournament is full');
    }

    const participant = await prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        teamName: body.name,
        nickname: body.nickname ?? null,
      },
      include: participantInclude,
    });

    res.status(201).json({ participant: serializeParticipant(participant) });
  }),
);

/** Admin edits a player's name, nickname or active status. */
router.patch(
  '/:id/participants/:participantId',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    const body = z
      .object({
        name: playerNameSchema.optional(),
        nickname: guestNicknameSchema.nullable().optional(),
        disabled: z.boolean().optional(),
      })
      .parse(req.body);

    const participant = await prisma.participant.findUnique({
      where: { id: req.params.participantId },
    });
    if (!participant || participant.tournamentId !== tournament.id) {
      throw new HttpError(404, 'Player not found');
    }

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        ...(body.name !== undefined ? { teamName: body.name } : {}),
        ...(body.nickname !== undefined ? { nickname: body.nickname } : {}),
        ...(body.disabled !== undefined ? { disabled: body.disabled } : {}),
      },
      include: participantInclude,
    });

    res.json({ participant: serializeParticipant(updated) });
  }),
);

/**
 * Admin links a manually-added player to a real account by nickname.
 * The participant row (and all its matches/stats) is kept, so the data
 * instantly becomes that user's.
 */
router.post(
  '/:id/participants/:participantId/link',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    const { nickname } = z.object({ nickname: guestNicknameSchema }).parse(req.body);

    const participant = await prisma.participant.findUnique({
      where: { id: req.params.participantId },
    });
    if (!participant || participant.tournamentId !== tournament.id) {
      throw new HttpError(404, 'Player not found');
    }
    if (participant.userId) {
      throw new HttpError(400, 'This player is already linked to an account');
    }

    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
      select: { id: true, nickname: true, firstName: true },
    });
    if (!user) {
      throw new HttpError(404, `No account found with nickname "${nickname}"`);
    }

    const alreadyIn = await prisma.participant.findFirst({
      where: { tournamentId: tournament.id, userId: user.id },
    });

    // If the real account already joined this tournament, fold the duplicate
    // entry into the manually-added player instead of failing. Matches and
    // stats are moved over, so nothing is lost.
    if (alreadyIn && alreadyIn.id !== participant.id) {
      const headToHead = await prisma.match.findFirst({
        where: {
          tournamentId: tournament.id,
          OR: [
            { homeId: participant.id, awayId: alreadyIn.id },
            { homeId: alreadyIn.id, awayId: participant.id },
          ],
        },
        select: { id: true },
      });

      if (headToHead) {
        throw new HttpError(
          409,
          'These two entries already played each other, so they cannot be merged. Delete one entry instead.',
        );
      }

      const [, , , updated] = await prisma.$transaction([
        prisma.match.updateMany({
          where: { tournamentId: tournament.id, homeId: alreadyIn.id },
          data: { homeId: participant.id },
        }),
        prisma.match.updateMany({
          where: { tournamentId: tournament.id, awayId: alreadyIn.id },
          data: { awayId: participant.id },
        }),
        prisma.participant.delete({ where: { id: alreadyIn.id } }),
        prisma.participant.update({
          where: { id: participant.id },
          data: { userId: user.id, nickname: null },
          include: participantInclude,
        }),
      ]);

      res.json({
        participant: serializeParticipant(updated),
        merged: true,
        mergedFrom: alreadyIn.teamName,
      });
      return;
    }

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: { userId: user.id, nickname: null },
      include: participantInclude,
    });

    res.json({ participant: serializeParticipant(updated), merged: false, mergedFrom: null });
  }),
);

/** Admin deletes a player and every match they played. */
router.delete(
  '/:id/participants/:participantId',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);

    const participant = await prisma.participant.findUnique({
      where: { id: req.params.participantId },
    });
    if (!participant || participant.tournamentId !== tournament.id) {
      throw new HttpError(404, 'Player not found');
    }
    if (participant.userId === tournament.creatorId) {
      throw new HttpError(400, 'The admin cannot be removed from the tournament');
    }

    await prisma.$transaction([
      prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          OR: [{ homeId: participant.id }, { awayId: participant.id }],
        },
      }),
      prisma.participant.delete({ where: { id: participant.id } }),
    ]);

    res.json({ ok: true });
  }),
);

/** Any active player (or the admin) can add a match. */
router.post(
  '/:id/matches',
  requireAuth,
  h(async (req, res) => {
    const { tournament } = await requireActiveMember(req.params.id, req.user!.id);
    if (tournament.status !== 'ACTIVE') {
      throw new HttpError(400, 'Matches can only be added while the tournament is active');
    }

    const body = z
      .object({
        homeId: z.string().min(1),
        awayId: z.string().min(1),
        homeScore: scoreSchema,
        awayScore: scoreSchema,
      })
      .parse(req.body);

    if (body.homeId === body.awayId) {
      throw new HttpError(400, 'Pick two different players');
    }

    const players = await prisma.participant.findMany({
      where: { tournamentId: tournament.id, id: { in: [body.homeId, body.awayId] } },
      select: { id: true, disabled: true },
    });
    if (players.length !== 2) {
      throw new HttpError(400, 'Both players must be part of this tournament');
    }
    if (players.some((p) => p.disabled)) {
      throw new HttpError(400, 'Disabled players cannot be added to a match');
    }

    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeId: body.homeId,
        awayId: body.awayId,
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        status: 'PLAYED',
        playedAt: new Date(),
      },
    });

    res.status(201).json({ match });
  }),
);

/** The admin or either player in the match can delete it. */
router.delete(
  '/:id/matches/:matchId',
  requireAuth,
  h(async (req, res) => {
    const { match } = await requireMatchManager(
      req.params.id,
      req.params.matchId,
      req.user!.id,
    );

    await prisma.match.delete({ where: { id: match.id } });
    res.json({ ok: true });
  }),
);

/** The admin or either player in the match can update the result. */
router.post(
  '/:id/matches/:matchId/result',
  requireAuth,
  h(async (req, res) => {
    const { homeScore, awayScore } = z
      .object({ homeScore: scoreSchema, awayScore: scoreSchema })
      .parse(req.body);

    const { tournament, match } = await requireMatchManager(
      req.params.id,
      req.params.matchId,
      req.user!.id,
    );

    if (tournament.status !== 'ACTIVE') {
      throw new HttpError(400, 'Results can only be edited while the tournament is active');
    }

    const updated = await prisma.match.update({
      where: { id: match.id },
      data: { homeScore, awayScore, status: 'PLAYED', playedAt: new Date() },
    });

    res.json({ match: updated });
  }),
);

/** Delete a tournament. Admin only. */
router.delete(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const tournament = await requireAdmin(req.params.id, req.user!.id);
    await prisma.tournament.delete({ where: { id: tournament.id } });
    res.json({ ok: true });
  }),
);

export default router;
