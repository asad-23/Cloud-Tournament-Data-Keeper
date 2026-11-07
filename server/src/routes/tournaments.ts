import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';
import { generateCode } from '../lib/code';
import { roundRobin } from '../lib/fixtures';
import { computeStandings } from '../lib/standings';
import { HttpError } from '../lib/http';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

const h =
  (fn: (req: any, res: any) => Promise<unknown>) =>
  (req: any, res: any, next: any) =>
    fn(req, res).catch(next);

const teamNameSchema = z.string().trim().min(1, 'Team name is required').max(30);
const nameSchema = z.string().trim().min(3, 'Tournament name is too short').max(60);

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
    orderBy: [{ matchday: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.TournamentInclude;

function serializeParticipant(p: any) {
  return {
    id: p.id,
    teamName: p.teamName,
    joinedAt: p.joinedAt,
    user: p.user,
  };
}

/** Create a tournament. The creator is automatically the first participant. */
router.post(
  '/',
  requireAuth,
  h(async (req, res) => {
    const body = z
      .object({
        name: nameSchema,
        teamName: teamNameSchema,
        description: z.string().trim().max(240).optional(),
        maxPlayers: z.number().int().min(2).max(32).optional(),
      })
      .parse(req.body);

    const code = await uniqueCode();

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        description: body.description,
        code,
        maxPlayers: body.maxPlayers ?? 20,
        creatorId: req.user!.id,
        participants: {
          create: { userId: req.user!.id, teamName: body.teamName },
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

/** Join a draft tournament using its share code. */
router.post(
  '/join',
  requireAuth,
  h(async (req, res) => {
    const { code, teamName } = z
      .object({ code: z.string().trim().min(4).max(12), teamName: teamNameSchema })
      .parse(req.body);

    const tournament = await prisma.tournament.findUnique({
      where: { code: code.toUpperCase() },
      include: { participants: true },
    });

    if (!tournament) throw new HttpError(404, 'No tournament found with that code');
    if (tournament.status !== 'DRAFT') {
      throw new HttpError(400, 'This tournament has already started');
    }

    const alreadyJoined = tournament.participants.some((p) => p.userId === req.user!.id);
    if (alreadyJoined) throw new HttpError(409, 'You are already in this tournament');

    if (tournament.participants.length >= tournament.maxPlayers) {
      throw new HttpError(400, 'This tournament is full');
    }

    const participant = await prisma.participant.create({
      data: { tournamentId: tournament.id, userId: req.user!.id, teamName },
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

/** Public discovery feed - anyone can browse active tournaments. */
router.get(
  '/explore',
  h(async (_req, res) => {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
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

/** Start the league: generate every round-robin fixture. Creator only. */
router.post(
  '/:id/start',
  requireAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        participants: { orderBy: { joinedAt: 'asc' } },
        _count: { select: { matches: true } },
      },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.creatorId !== req.user!.id) {
      throw new HttpError(403, 'Only the creator can start this tournament');
    }
    if (tournament.status !== 'DRAFT') {
      throw new HttpError(400, 'This tournament is not in draft');
    }
    if (tournament.participants.length < 2) {
      throw new HttpError(400, 'At least 2 participants are required');
    }
    if (tournament._count.matches > 0) {
      throw new HttpError(400, 'Fixtures have already been generated');
    }

    const fixtures = roundRobin(tournament.participants.length);

    await prisma.$transaction([
      prisma.match.createMany({
        data: fixtures.map((fixture) => ({
          tournamentId: tournament.id,
          homeId: tournament.participants[fixture.homeIndex].id,
          awayId: tournament.participants[fixture.awayIndex].id,
          matchday: fixture.matchday,
        })),
      }),
      prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: 'ACTIVE', startedAt: new Date() },
      }),
    ]);

    res.json({ ok: true, matchesCreated: fixtures.length });
  }),
);

/** Mark the tournament as finished. Creator only. */
router.post(
  '/:id/finish',
  requireAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      select: { id: true, creatorId: true, status: true },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.creatorId !== req.user!.id) {
      throw new HttpError(403, 'Only the creator can finish this tournament');
    }
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

/** Rotate the share code. Creator only, draft only. */
router.post(
  '/:id/code',
  requireAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      select: { id: true, creatorId: true, status: true },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.creatorId !== req.user!.id) {
      throw new HttpError(403, 'Only the creator can change the code');
    }
    if (tournament.status !== 'DRAFT') {
      throw new HttpError(400, 'The code can only change before the tournament starts');
    }

    const code = await uniqueCode();
    await prisma.tournament.update({ where: { id: tournament.id }, data: { code } });

    res.json({ code });
  }),
);

/** Record or edit a result. Any participant of the tournament can do this. */
router.post(
  '/:id/matches/:matchId/result',
  requireAuth,
  h(async (req, res) => {
    const { homeScore, awayScore } = z
      .object({
        homeScore: z.number().int().min(0).max(99),
        awayScore: z.number().int().min(0).max(99),
      })
      .parse(req.body);

    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.status !== 'ACTIVE') {
      throw new HttpError(400, 'Results can only be recorded while the tournament is active');
    }

    const isParticipant = tournament.participants.some((p) => p.userId === req.user!.id);
    if (!isParticipant) throw new HttpError(403, 'Only participants can record results');

    const match = await prisma.match.findUnique({ where: { id: req.params.matchId } });
    if (!match || match.tournamentId !== tournament.id) {
      throw new HttpError(404, 'Match not found');
    }

    const updated = await prisma.match.update({
      where: { id: match.id },
      data: { homeScore, awayScore, status: 'PLAYED', playedAt: new Date() },
    });

    res.json({ match: updated });
  }),
);

/** Clear a result so it can be re-entered. Any participant can do this. */
router.delete(
  '/:id/matches/:matchId/result',
  requireAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.status !== 'ACTIVE') {
      throw new HttpError(400, 'Results can only be edited while the tournament is active');
    }

    const isParticipant = tournament.participants.some((p) => p.userId === req.user!.id);
    if (!isParticipant) throw new HttpError(403, 'Only participants can edit results');

    const match = await prisma.match.findUnique({ where: { id: req.params.matchId } });
    if (!match || match.tournamentId !== tournament.id) {
      throw new HttpError(404, 'Match not found');
    }

    const updated = await prisma.match.update({
      where: { id: match.id },
      data: { homeScore: null, awayScore: null, status: 'SCHEDULED', playedAt: null },
    });

    res.json({ match: updated });
  }),
);

/** Delete a tournament. Creator only. */
router.delete(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      select: { id: true, creatorId: true },
    });

    if (!tournament) throw new HttpError(404, 'Tournament not found');
    if (tournament.creatorId !== req.user!.id) {
      throw new HttpError(403, 'Only the creator can delete this tournament');
    }

    await prisma.tournament.delete({ where: { id: tournament.id } });
    res.json({ ok: true });
  }),
);

export default router;
