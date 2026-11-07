export type User = {
  id: string;
  nickname: string;
  firstName: string;
};

export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type MatchStatus = 'SCHEDULED' | 'PLAYED';
export type FormResult = 'W' | 'D' | 'L';

export type StandingRow = {
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
};

export type Participant = {
  id: string;
  teamName: string;
  joinedAt: string;
  user: User;
};

export type Match = {
  id: string;
  tournamentId: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  matchday: number;
  status: MatchStatus;
  playedAt: string | null;
  createdAt: string;
};

export type TournamentCreator = {
  id: string;
  nickname: string;
  firstName: string;
};

export type TournamentDetail = {
  tournament: {
    id: string;
    name: string;
    description: string | null;
    code?: string;
    status: TournamentStatus;
    maxPlayers: number;
    creatorId: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    creator: TournamentCreator;
  };
  participants: Participant[];
  matches: Match[];
  standings: StandingRow[];
  isMember: boolean;
};

export type TournamentSummary = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  status: TournamentStatus;
  maxPlayers: number;
  createdAt: string;
  creator: { id: string; nickname: string };
  myTeamName: string | null;
  participantCount: number;
  matchCount: number;
};

export type ExploreTournament = {
  id: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  createdAt: string;
  creator: { id: string; nickname: string };
  participantCount: number;
  matchCount: number;
};
