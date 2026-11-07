export interface Fixture {
  homeIndex: number;
  awayIndex: number;
  matchday: number;
}

/**
 * Single round-robin using the circle method.
 * Every participant plays every other participant exactly once.
 */
export function roundRobin(teamCount: number): Fixture[] {
  const teams: number[] = Array.from({ length: teamCount }, (_, i) => i);
  if (teams.length % 2 === 1) teams.push(-1); // bye

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const fixtures: Fixture[] = [];

  let order = [...teams];
  for (let round = 0; round < rounds; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const a = order[i];
      const b = order[n - 1 - i];
      if (a === -1 || b === -1) continue;

      // Alternate home/away so no team is always at home.
      const homeFirst = (round + i) % 2 === 0;
      fixtures.push({
        homeIndex: homeFirst ? a : b,
        awayIndex: homeFirst ? b : a,
        matchday: round + 1,
      });
    }

    // Fix the first team, rotate the rest.
    order = [order[0], order[n - 1], ...order.slice(1, n - 1)];
  }

  return fixtures;
}
