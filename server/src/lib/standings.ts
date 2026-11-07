export type FormResult = 'W' | 'D' | 'L';

export interface StandingRow {
  participantId: string;
  userId: string;
  nickname: string;
  firstName: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[];
  position: number;
}

interface ParticipantInput {
  id: string;
  teamName: string;
  user: { id: string; nickname: string; firstName: string };
}

interface MatchInput {
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'PLAYED';
  playedAt: Date | null;
}

export function computeStandings(
  participants: ParticipantInput[],
  matches: MatchInput[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  for (const p of participants) {
    rows.set(p.id, {
      participantId: p.id,
      userId: p.user.id,
      nickname: p.user.nickname,
      firstName: p.user.firstName,
      teamName: p.teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      position: 0,
    });
  }

  const played = matches
    .filter(
      (m) =>
        m.status === 'PLAYED' && m.homeScore !== null && m.awayScore !== null,
    )
    .sort(
      (a, b) => (a.playedAt?.getTime() ?? 0) - (b.playedAt?.getTime() ?? 0),
    );

  for (const match of played) {
    const home = rows.get(match.homeId);
    const away = rows.get(match.awayId);
    if (!home || !away) continue;

    const hs = match.homeScore as number;
    const as = match.awayScore as number;

    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (hs > as) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
      home.form.push('W');
      away.form.push('L');
    } else if (hs < as) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
      away.form.push('W');
      home.form.push('L');
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push('D');
      away.form.push('D');
    }
  }

  const table = Array.from(rows.values());
  for (const row of table) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    // Keep only the last five results, oldest -> newest.
    row.form = row.form.slice(-5);
  }

  table.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );

  table.forEach((row, index) => {
    row.position = index + 1;
  });

  return table;
}
