import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './auth';

export const queryKeys = {
  myTournaments: (userId?: string) => ['my-tournaments', userId] as const,
  explore: ['explore'] as const,
  tournament: (id: string) => ['tournament', id] as const,
};

export function useMyTournaments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.myTournaments(user?.id),
    queryFn: async () => (await api.myTournaments()).tournaments,
    enabled: Boolean(user),
  });
}

export function useExplore() {
  return useQuery({
    queryKey: queryKeys.explore,
    queryFn: async () => (await api.explore()).tournaments,
  });
}

export function useTournament(id?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.tournament(id ?? ''), user?.id ?? 'guest'],
    queryFn: () => api.tournament(id as string),
    enabled: Boolean(id) && !loading,
    refetchInterval: 20000,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.explore });
    },
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.joinTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });
}

export function useFinishTournament(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.finishTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.explore });
    },
  });
}

export function useAddMatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      homeId: string;
      awayId: string;
      homeScore: number;
      awayScore: number;
    }) => api.addMatch(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });
}

export function useDeleteMatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => api.deleteMatch(id, matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });
}

export function useAddPlayer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; nickname?: string }) => api.addPlayer(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });
}

export function useUpdatePlayer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      ...body
    }: {
      participantId: string;
      name?: string;
      nickname?: string | null;
      disabled?: boolean;
    }) => api.updatePlayer(id, participantId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
    },
  });
}

export function useLinkPlayer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, nickname }: { participantId: string; nickname: string }) =>
      api.linkPlayer(id, participantId, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
    },
  });
}

export function useDeletePlayer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => api.deletePlayer(id, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });
}

export function useRegenerateCode(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.regenerateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
    },
  });
}

export function useSetResult(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => api.setResult(tournamentId, matchId, { homeScore, awayScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(tournamentId) });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: ({ user }) => {
      updateUser(user);
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.explore });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.explore });
    },
  });
}
