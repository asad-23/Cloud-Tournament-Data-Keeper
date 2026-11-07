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

export function useStartTournament(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.startTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
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

export function useResetResult(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => api.resetResult(tournamentId, matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(tournamentId) });
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
