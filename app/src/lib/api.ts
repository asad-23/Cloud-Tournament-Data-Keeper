import Constants from 'expo-constants';
import type {
  ExploreTournament,
  Match,
  TournamentDetail,
  TournamentSummary,
  User,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_PORT = 4000;

/**
 * Resolution order:
 * 1. EXPO_PUBLIC_API_URL (set this for release/APK builds)
 * 2. The Expo dev-server host, so a phone on the same Wi-Fi finds your laptop
 * 3. localhost (emulator / web)
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${DEFAULT_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_PORT}/api`;
}

export const API_BASE = resolveBaseUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = authToken } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new ApiError(response.status, data?.error ?? 'Something went wrong');
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'The server took too long to respond');
    }
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  register: (body: { nickname: string; firstName: string }) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body }),

  login: (body: { nickname: string; firstName: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body }),

  me: () => request<{ user: User }>('/auth/me'),

  myTournaments: () => request<{ tournaments: TournamentSummary[] }>('/tournaments'),

  explore: () => request<{ tournaments: ExploreTournament[] }>('/tournaments/explore'),

  tournament: (id: string) => request<TournamentDetail>(`/tournaments/${id}`),

  createTournament: (body: {
    name: string;
    teamName: string;
    description?: string;
    maxPlayers?: number;
  }) =>
    request<{
      tournament: TournamentDetail['tournament'] & { code: string };
      participant: { id: string; teamName: string };
    }>('/tournaments', { method: 'POST', body }),

  joinTournament: (body: { code: string; teamName: string }) =>
    request<{
      tournament: { id: string; name: string; code: string };
      participant: { id: string; teamName: string };
    }>('/tournaments/join', { method: 'POST', body }),

  startTournament: (id: string) =>
    request<{ ok: boolean; matchesCreated: number }>(`/tournaments/${id}/start`, {
      method: 'POST',
    }),

  finishTournament: (id: string) =>
    request<{ ok: boolean }>(`/tournaments/${id}/finish`, { method: 'POST' }),

  regenerateCode: (id: string) =>
    request<{ code: string }>(`/tournaments/${id}/code`, { method: 'POST' }),

  setResult: (
    tournamentId: string,
    matchId: string,
    body: { homeScore: number; awayScore: number },
  ) => request<{ match: Match }>(`/tournaments/${tournamentId}/matches/${matchId}/result`, {
    method: 'POST',
    body,
  }),

  resetResult: (tournamentId: string, matchId: string) =>
    request<{ match: Match }>(`/tournaments/${tournamentId}/matches/${matchId}/result`, {
      method: 'DELETE',
    }),

  deleteTournament: (id: string) =>
    request<{ ok: boolean }>(`/tournaments/${id}`, { method: 'DELETE' }),
};
