import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { AddMatchSheet } from '@/components/AddMatchSheet';
import { AddPlayerSheet } from '@/components/AddPlayerSheet';
import { BottomTabs, type BottomTabItem } from '@/components/BottomTabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormDots } from '@/components/FormDots';
import { LinkAccountSheet } from '@/components/LinkAccountSheet';
import { PlayerSheet } from '@/components/PlayerSheet';
import { Podium } from '@/components/Podium';
import { StandingsTable } from '@/components/StandingsTable';
import { useToast } from '@/components/Toast';
import {
  Avatar,
  Card,
  EmptyState,
  IconButton,
  Pill,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { formatDate, statusMeta } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import {
  useAddMatch,
  useAddPlayer,
  useDeleteMatch,
  useDeletePlayer,
  useDeleteTournament,
  useFinishTournament,
  useLinkPlayer,
  useTournament,
  useUpdatePlayer,
} from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';
import type { Match, StandingRow } from '@/lib/types';

type TabKey = 'table' | 'matches' | 'players' | 'stats';

const TABS: BottomTabItem<TabKey>[] = [
  { key: 'table', label: 'Table', icon: 'podium' },
  { key: 'matches', label: 'Matches', icon: 'football' },
  { key: 'players', label: 'Players', icon: 'people' },
  { key: 'stats', label: 'Stats', icon: 'stats-chart' },
];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

type ConfirmState =
  | { kind: 'finish' }
  | { kind: 'deleteTournament' }
  | { kind: 'deleteMatch'; matchId: string; label: string }
  | { kind: 'deletePlayer'; participantId: string; name: string }
  | null;

function StatCard({
  icon,
  label,
  team,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  team: string;
  value: string;
  tone: 'accent' | 'purple' | 'gold' | 'danger';
}) {
  const color =
    tone === 'gold'
      ? colors.gold
      : tone === 'purple'
        ? colors.purple
        : tone === 'danger'
          ? colors.danger
          : colors.accent;
  const background =
    tone === 'gold'
      ? colors.goldSoft
      : tone === 'purple'
        ? colors.purpleSoft
        : tone === 'danger'
          ? colors.dangerSoft
          : colors.accentSoft;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTeam} numberOfLines={1}>
        {team}
      </Text>
    </View>
  );
}

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, isError, refetch, isRefetching, error } = useTournament(id);
  const finish = useFinishTournament(id ?? '');
  const removeTournament = useDeleteTournament();
  const addMatch = useAddMatch(id ?? '');
  const deleteMatch = useDeleteMatch(id ?? '');
  const addPlayer = useAddPlayer(id ?? '');
  const updatePlayer = useUpdatePlayer(id ?? '');
  const linkPlayer = useLinkPlayer(id ?? '');
  const deletePlayer = useDeletePlayer(id ?? '');

  const [tab, setTab] = useState<TabKey>('table');
  const [detailedTable, setDetailedTable] = useState(false);
  const [selected, setSelected] = useState<StandingRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<StandingRow | null>(null);

  const tournament = data?.tournament;
  const participants = useMemo(() => data?.participants ?? [], [data]);
  const matches = useMemo(() => data?.matches ?? [], [data]);
  const standings = useMemo(() => data?.standings ?? [], [data]);

  const isAdmin = Boolean(user && tournament && user.id === tournament.creatorId);
  const isMember = data?.isMember ?? false;
  const isActive = tournament?.status === 'ACTIVE';
  const canEdit = isActive && (isAdmin || isMember);
  const playedCount = matches.filter((match) => match.status === 'PLAYED').length;
  const meta = tournament ? statusMeta(tournament.status) : null;

  const teamById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant.teamName])),
    [participants],
  );

  const activePlayers = useMemo(
    () => participants.filter((participant) => !participant.disabled),
    [participants],
  );

  const stats = useMemo(() => {
    if (standings.length === 0) return null;

    const played = matches.filter(
      (match) =>
        match.status === 'PLAYED' && match.homeScore !== null && match.awayScore !== null,
    );

    const bestAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    const withGames = standings.filter((row) => row.played > 0);
    const bestDefense = [...(withGames.length > 0 ? withGames : standings)].sort(
      (a, b) => a.goalsAgainst - b.goalsAgainst,
    )[0];
    const mostWins = [...standings].sort((a, b) => b.won - a.won)[0];
    const totalGoals = standings.reduce((sum, row) => sum + row.goalsFor, 0);
    const averageGoals = played.length > 0 ? totalGoals / played.length : 0;

    let biggestWin: { match: Match; margin: number } | null = null;
    let cleanSheets = 0;

    for (const match of played) {
      const homeScore = match.homeScore as number;
      const awayScore = match.awayScore as number;
      const margin = Math.abs(homeScore - awayScore);

      if (margin > 0 && (!biggestWin || margin > biggestWin.margin)) {
        biggestWin = { match, margin };
      }
      if (homeScore === 0 || awayScore === 0) cleanSheets += 1;
    }

    const biggestLabel = biggestWin
      ? `${teamById.get(biggestWin.match.homeId) ?? 'Home'} ${biggestWin.match.homeScore}-${biggestWin.match.awayScore} ${teamById.get(biggestWin.match.awayId) ?? 'Away'}`
      : 'No decisive win yet';

    return {
      bestAttack,
      bestDefense,
      mostWins,
      totalGoals,
      averageGoals,
      biggestLabel,
      biggestMargin: biggestWin?.margin ?? 0,
      cleanSheets,
      playedCount: played.length,
    };
  }, [standings, matches, teamById]);

  const copyCode = async () => {
    if (!tournament?.code) return;
    await Clipboard.setStringAsync(tournament.code);
    Haptics.selectionAsync().catch(() => undefined);
    toast.show(`Code ${tournament.code} copied`, 'success');
  };

  const shareInvite = async () => {
    if (!tournament?.code) {
      toast.show('Join code is only visible to players', 'info');
      return;
    }
    await Share.share({
      message: `Join my PES League tournament "${tournament.name}"!\n\nOpen PES League, tap Join, and enter code: ${tournament.code}`,
    }).catch(() => undefined);
  };

  const openConfirm = (next: ConfirmState) => {
    setConfirm(next);
    setConfirmVisible(true);
  };

  const actions: SheetAction[] = [];
  if (isAdmin && tournament?.code) {
    actions.push({ label: 'Copy join code', icon: 'copy-outline', onPress: copyCode });
    actions.push({ label: 'Share invite', icon: 'share-social-outline', onPress: shareInvite });
  }
  if (isAdmin && isActive) {
    actions.push({
      label: 'Finish tournament',
      icon: 'flag-outline',
      onPress: () => openConfirm({ kind: 'finish' }),
    });
  }
  if (isAdmin) {
    actions.push({
      label: 'Delete tournament',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => openConfirm({ kind: 'deleteTournament' }),
    });
  }

  const handleConfirm = () => {
    if (!confirm) return;

    if (confirm.kind === 'finish') {
      finish.mutate(undefined, {
        onSuccess: () => {
          setConfirmVisible(false);
          toast.show('Tournament finished', 'success');
        },
        onError: (caught) => {
          setConfirmVisible(false);
          toast.show(caught instanceof Error ? caught.message : 'Could not finish', 'error');
        },
      });
      return;
    }

    if (confirm.kind === 'deleteTournament') {
      removeTournament.mutate(id, {
        onSuccess: () => {
          setConfirmVisible(false);
          toast.show('Tournament deleted', 'info');
          router.replace('/(tabs)');
        },
        onError: (caught) => {
          setConfirmVisible(false);
          toast.show(caught instanceof Error ? caught.message : 'Could not delete', 'error');
        },
      });
      return;
    }

    if (confirm.kind === 'deleteMatch') {
      deleteMatch.mutate(confirm.matchId, {
        onSuccess: () => {
          setConfirmVisible(false);
          toast.show('Match deleted', 'info');
        },
        onError: (caught) => {
          setConfirmVisible(false);
          toast.show(caught instanceof Error ? caught.message : 'Could not delete match', 'error');
        },
      });
      return;
    }

    if (confirm.kind === 'deletePlayer') {
      deletePlayer.mutate(confirm.participantId, {
        onSuccess: () => {
          setConfirmVisible(false);
          setSelected(null);
          toast.show('Player deleted', 'info');
        },
        onError: (caught) => {
          setConfirmVisible(false);
          toast.show(caught instanceof Error ? caught.message : 'Could not delete player', 'error');
        },
      });
    }
  };

  const togglePlayerDisabled = (row: StandingRow) => {
    updatePlayer.mutate(
      { participantId: row.participantId, disabled: !row.disabled },
      {
        onSuccess: (result) => {
          setSelected((current) =>
            current && current.participantId === row.participantId
              ? { ...current, disabled: result.participant.disabled }
              : current,
          );
          toast.show(
            result.participant.disabled ? 'Player disabled' : 'Player enabled',
            'success',
          );
        },
        onError: (caught) => {
          toast.show(caught instanceof Error ? caught.message : 'Could not update player', 'error');
        },
      },
    );
  };

  if (isLoading || authLoading) {
    return (
      <Screen>
        <SafeAreaView style={styles.center} edges={['top']}>
          <ActivityIndicator color={colors.accent} />
        </SafeAreaView>
      </Screen>
    );
  }

  if (isError || !data || !tournament) {
    return (
      <Screen>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <IconButton icon="arrow-back" onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Tournament</Text>
            <View style={{ width: 42 }} />
          </View>
          <View style={styles.center}>
            <EmptyState
              icon="cloud-offline-outline"
              title="Could not load tournament"
              message={error instanceof Error ? error.message : 'Check your connection.'}
            />
            <Pressable onPress={() => refetch()} style={styles.retry}>
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <IconButton icon="arrow-back" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tournament.name}
            </Text>
            <Text style={styles.headerSub}>by @{tournament.creator.nickname}</Text>
          </View>
          {isMember && tournament.code ? (
            <IconButton icon="share-outline" onPress={shareInvite} />
          ) : null}
          {isAdmin ? (
            <IconButton icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.card}
            />
          }
        >
          {tab === 'table' ? (
            <>
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroTop}>
                  {meta ? (
                    <Pill label={meta.label} color={meta.color} background={meta.background} dot />
                  ) : null}
                  <Text style={styles.heroMeta}>
                    {plural(participants.length, 'player')} · {plural(playedCount, 'match')}
                  </Text>
                </View>

                {tournament.description ? (
                  <Text style={styles.description}>{tournament.description}</Text>
                ) : null}

                <Text style={styles.created}>Created {formatDate(tournament.createdAt)}</Text>

                {isMember && tournament.code ? (
                  <View style={styles.codeBlock}>
                    <View>
                      <Text style={styles.codeLabel}>JOIN CODE</Text>
                      <Text style={styles.code}>{tournament.code}</Text>
                    </View>
                    <View style={styles.codeButtons}>
                      <IconButton icon="copy-outline" onPress={copyCode} />
                      <IconButton icon="share-social-outline" onPress={shareInvite} />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.hint}>
                    The join code is only visible to players. Ask the admin for it.
                  </Text>
                )}

                {!isMember && isActive ? (
                  <PrimaryButton
                    label="Join with code"
                    icon="enter-outline"
                    onPress={() => router.push('/join')}
                    style={{ marginTop: spacing.md }}
                  />
                ) : null}
              </LinearGradient>

              <View style={{ marginTop: spacing.xl }}>
                <SectionTitle
                  title="Leaderboard"
                  subtitle="Top 3 of the table"
                  right={<Pill label="Top 3" color={colors.textDim} />}
                />
                {standings.length > 0 ? (
                  <Podium standings={standings} />
                ) : (
                  <Card>
                    <Text style={styles.hint}>The leaderboard appears when players join.</Text>
                  </Card>
                )}
              </View>

              <View style={{ marginTop: spacing.xl }}>
                {standings.length > 0 ? (
                  <>
                    <View style={styles.tableToolbar}>
                      <Text style={styles.tableHint}>Tap a row for full stats</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          detailedTable ? 'Show compact table' : 'Show all table columns'
                        }
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => undefined);
                          setDetailedTable((value) => !value);
                        }}
                        style={({ pressed }) => [styles.tableToggle, pressed && { opacity: 0.7 }]}
                      >
                        <Ionicons
                          name={detailedTable ? 'contract-outline' : 'expand-outline'}
                          size={13}
                          color={colors.accent}
                        />
                        <Text style={styles.tableToggleLabel}>
                          {detailedTable ? 'Compact' : 'All stats'}
                        </Text>
                      </Pressable>
                    </View>
                    <StandingsTable
                      standings={standings}
                      onSelect={setSelected}
                      detailed={detailedTable}
                    />
                  </>
                ) : (
                  <Card>
                    <EmptyState
                      icon="podium-outline"
                      title="No standings yet"
                      message="Add players and matches to build the table."
                    />
                  </Card>
                )}
              </View>
            </>
          ) : null}

          {tab === 'matches' ? (
            <>
              {isAdmin && isActive ? (
                <PrimaryButton
                  label="Add match"
                  icon="add"
                  onPress={() => {
                    addMatch.reset();
                    setAddMatchOpen(true);
                  }}
                  style={{ marginBottom: spacing.lg }}
                />
              ) : null}

              {matches.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="football-outline"
                    title="No matches yet"
                    message={
                      isAdmin
                        ? 'Add a match: pick two players and enter the score.'
                        : 'The admin will add matches here.'
                    }
                  />
                </Card>
              ) : (
                matches.map((match) => {
                  const homeName = teamById.get(match.homeId) ?? 'Home';
                  const awayName = teamById.get(match.awayId) ?? 'Away';
                  const played = match.status === 'PLAYED';
                  const homeWon = played && (match.homeScore as number) > (match.awayScore as number);
                  const awayWon = played && (match.awayScore as number) > (match.homeScore as number);

                  const routeParams = played
                    ? {
                        id: match.id,
                        tournamentId: id,
                        matchId: match.id,
                        home: homeName,
                        away: awayName,
                        homeScore: String(match.homeScore),
                        awayScore: String(match.awayScore),
                      }
                    : {
                        id: match.id,
                        tournamentId: id,
                        matchId: match.id,
                        home: homeName,
                        away: awayName,
                      };

                  return (
                    <Pressable
                      key={match.id}
                      disabled={!canEdit}
                      onPress={() => router.push({ pathname: '/match/[id]', params: routeParams })}
                      style={({ pressed }) => [
                        styles.matchCard,
                        pressed && canEdit && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.matchMain}>
                        <Text
                          style={[
                            styles.matchTeam,
                            homeWon && styles.matchWinner,
                          ]}
                          numberOfLines={2}
                        >
                          {homeName}
                        </Text>
                        <View style={styles.matchScoreBox}>
                          {played ? (
                            <Text style={styles.matchScoreText}>
                              {match.homeScore} - {match.awayScore}
                            </Text>
                          ) : (
                            <Text style={styles.matchVs}>VS</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.matchTeam,
                            { textAlign: 'right' },
                            awayWon && styles.matchWinner,
                          ]}
                          numberOfLines={2}
                        >
                          {awayName}
                        </Text>
                      </View>
                      <View style={styles.matchFoot}>
                        <Text style={styles.matchDate}>
                          {formatDate(match.playedAt ?? match.createdAt)}
                        </Text>
                        <View style={{ flex: 1 }} />
                        {canEdit ? (
                          <View style={styles.matchEditHint}>
                            <Ionicons name="create-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.matchEditLabel}>Edit score</Text>
                          </View>
                        ) : null}
                        {isAdmin ? (
                          <Pressable
                            accessibilityLabel={`Delete match ${homeName} versus ${awayName}`}
                            hitSlop={8}
                            onPress={() =>
                              openConfirm({
                                kind: 'deleteMatch',
                                matchId: match.id,
                                label: `${homeName} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${awayName}`,
                              })
                            }
                            style={({ pressed }) => [
                              styles.matchDelete,
                              pressed && { opacity: 0.6 },
                            ]}
                          >
                            <Ionicons name="trash-outline" size={15} color={colors.danger} />
                          </Pressable>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          ) : null}

          {tab === 'players' ? (
            <>
              {isAdmin ? (
                <PrimaryButton
                  label="Add player"
                  icon="person-add"
                  onPress={() => {
                    addPlayer.reset();
                    setAddPlayerOpen(true);
                  }}
                  style={{ marginBottom: spacing.lg }}
                />
              ) : null}

              {standings.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="people-outline"
                    title="No players yet"
                    message="Share the join code or add players as admin."
                  />
                </Card>
              ) : (
                standings.map((row) => (
                  <Pressable
                    key={row.participantId}
                    onPress={() => setSelected(row)}
                    style={({ pressed }) => [
                      styles.playerRow,
                      pressed && { backgroundColor: colors.cardAlt },
                    ]}
                  >
                    <Avatar
                      name={row.teamName}
                      size={42}
                      tone={row.position === 1 ? 'gold' : row.disabled ? 'purple' : 'accent'}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.playerNameRow}>
                        <Text style={styles.playerTeam} numberOfLines={1}>
                          {row.teamName}
                        </Text>
                        {row.disabled ? (
                          <Text style={styles.playerOff}>OFF</Text>
                        ) : null}
                        {row.userId === user?.id ? (
                          <Text style={styles.playerYou}>YOU</Text>
                        ) : null}
                      </View>
                      <Text style={styles.playerMeta} numberOfLines={1}>
                        @{row.nickname}
                        {row.userId ? '' : ' · added by admin'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                ))
              )}
            </>
          ) : null}

          {tab === 'stats' ? (
            !stats ? (
              <Card>
                <EmptyState
                  icon="stats-chart-outline"
                  title="No stats yet"
                  message="Add players and matches and the league stats will light up."
                />
              </Card>
            ) : (
              <>
                <SectionTitle
                  title="Leaderboard"
                  subtitle="Top 3 of the table"
                  right={<Pill label="Top 3" color={colors.textDim} />}
                />
                <Podium standings={standings} />

                <View style={{ marginTop: spacing.xl }}>
                  <SectionTitle title="League stats" subtitle="Numbers from every match" />
                  <View style={styles.statGrid}>
                    <StatCard
                      icon="flame"
                      label="Best attack"
                      team={stats.bestAttack.teamName}
                      value={`${stats.bestAttack.goalsFor} GF`}
                      tone="accent"
                    />
                    <StatCard
                      icon="shield"
                      label="Best defense"
                      team={stats.bestDefense.teamName}
                      value={`${stats.bestDefense.goalsAgainst} GA`}
                      tone="purple"
                    />
                    <StatCard
                      icon="trophy"
                      label="Most wins"
                      team={stats.mostWins.teamName}
                      value={`${stats.mostWins.won} wins`}
                      tone="gold"
                    />
                    <StatCard
                      icon="football"
                      label="Total goals"
                      team={plural(stats.playedCount, 'match')}
                      value={`${stats.totalGoals}`}
                      tone="accent"
                    />
                    <StatCard
                      icon="speedometer"
                      label="Goals per match"
                      team={`${stats.playedCount} played`}
                      value={stats.averageGoals.toFixed(1)}
                      tone="purple"
                    />
                    <StatCard
                      icon="hand-left"
                      label="Clean sheets"
                      team="matches"
                      value={`${stats.cleanSheets}`}
                      tone="accent"
                    />
                    <StatCard
                      icon="flash"
                      label="Biggest win"
                      team={stats.biggestLabel}
                      value={stats.biggestMargin > 0 ? `${stats.biggestMargin} GD` : '—'}
                      tone="danger"
                    />
                    <StatCard
                      icon="people"
                      label="Players"
                      team={`${participants.length} registered`}
                      value={`${standings.length}`}
                      tone="gold"
                    />
                  </View>
                </View>

                <SectionTitle title="Form guide" subtitle="Last 5 results per player" />
                <Card>
                  {standings.map((row, index) => (
                    <View key={row.participantId}>
                      <View style={styles.formRow}>
                        <Text style={styles.formPos}>{row.position}</Text>
                        <Text style={styles.formTeam} numberOfLines={1}>
                          {row.teamName}
                        </Text>
                        <FormDots form={row.form} size={16} emptyLabel="No games" />
                      </View>
                      {index < standings.length - 1 ? <View style={styles.formDivider} /> : null}
                    </View>
                  ))}
                </Card>
              </>
            )
          ) : null}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        <BottomTabs tabs={TABS} value={tab} onChange={setTab} />
      </SafeAreaView>

      <ActionSheet
        visible={menuOpen}
        title={tournament.name}
        actions={actions}
        onClose={() => setMenuOpen(false)}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title={
          confirm?.kind === 'finish'
            ? 'Finish the tournament?'
            : confirm?.kind === 'deleteTournament'
              ? 'Delete this tournament?'
              : confirm?.kind === 'deleteMatch'
                ? 'Delete this match?'
                : 'Delete this player?'
        }
        message={
          confirm?.kind === 'finish'
            ? 'The final table will be saved. Scores can no longer be edited.'
            : confirm?.kind === 'deleteTournament'
              ? 'This permanently deletes the tournament, its players and matches for everyone.'
              : confirm?.kind === 'deleteMatch'
                ? `${confirm.label} will be removed and the table will update.`
                : `${confirm?.kind === 'deletePlayer' ? confirm.name : 'This player'} and every match they played will be deleted.`
        }
        confirmLabel={
          confirm?.kind === 'finish'
            ? 'Finish'
            : confirm?.kind === 'deleteMatch'
              ? 'Delete match'
              : confirm?.kind === 'deletePlayer'
                ? 'Delete player'
                : 'Delete'
        }
        destructive={confirm?.kind !== 'finish'}
        loading={
          finish.isPending ||
          removeTournament.isPending ||
          deleteMatch.isPending ||
          deletePlayer.isPending
        }
        icon={
          confirm?.kind === 'finish'
            ? 'flag-outline'
            : confirm?.kind === 'deleteMatch'
              ? 'trash-outline'
              : confirm?.kind === 'deletePlayer'
                ? 'person-remove-outline'
                : 'trash-outline'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />

      <AddMatchSheet
        key={addMatchOpen ? 'open' : 'closed'}
        visible={addMatchOpen}
        players={activePlayers}
        loading={addMatch.isPending}
        error={addMatch.error instanceof Error ? addMatch.error.message : null}
        onClose={() => setAddMatchOpen(false)}
        onSubmit={(body) =>
          addMatch.mutate(body, {
            onSuccess: () => {
              setAddMatchOpen(false);
              toast.show('Match added', 'success');
            },
          })
        }
      />

      <AddPlayerSheet
        key={addPlayerOpen ? 'open' : 'closed'}
        visible={addPlayerOpen}
        loading={addPlayer.isPending}
        error={addPlayer.error instanceof Error ? addPlayer.error.message : null}
        onClose={() => setAddPlayerOpen(false)}
        onSubmit={(body) =>
          addPlayer.mutate(body, {
            onSuccess: () => {
              setAddPlayerOpen(false);
              toast.show('Player added', 'success');
            },
          })
        }
      />

      <LinkAccountSheet
        key={linkTarget?.participantId ?? 'closed'}
        visible={Boolean(linkTarget)}
        playerName={linkTarget?.teamName ?? ''}
        loading={linkPlayer.isPending}
        error={linkPlayer.error instanceof Error ? linkPlayer.error.message : null}
        onClose={() => setLinkTarget(null)}
        onSubmit={(nickname) => {
          if (!linkTarget) return;
          linkPlayer.mutate(
            { participantId: linkTarget.participantId, nickname },
            {
              onSuccess: () => {
                setLinkTarget(null);
                setSelected(null);
                toast.show('Account linked', 'success');
              },
            },
          );
        }}
      />

      <PlayerSheet
        row={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onLink={() => {
          linkPlayer.reset();
          setLinkTarget(selected);
        }}
        onToggleDisabled={() => {
          if (selected) togglePlayerDisabled(selected);
        }}
        onDelete={() => {
          if (!selected) return;
          openConfirm({
            kind: 'deletePlayer',
            participantId: selected.participantId,
            name: selected.teamName,
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.md,
  },
  created: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.sm,
  },
  codeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44,229,155,0.07)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.22)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  code: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 5,
    marginTop: 2,
  },
  codeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.md,
  },
  tableToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tableHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.25)',
  },
  tableToggleLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  matchMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchTeam: {
    flex: 1,
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  matchWinner: {
    color: colors.text,
  },
  matchScoreBox: {
    paddingHorizontal: spacing.md,
    minWidth: 76,
    alignItems: 'center',
  },
  matchScoreText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  matchVs: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  matchDate: {
    color: colors.textMuted,
    fontSize: 10,
  },
  matchEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchEditLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  matchDelete: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerTeam: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  playerOff: {
    color: colors.warning,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(255,176,32,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerYou: {
    color: colors.accent,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47.8%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  statTeam: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  formPos: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    width: 20,
  },
  formTeam: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  retry: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  retryLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
});
