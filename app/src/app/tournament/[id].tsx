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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormDots } from '@/components/FormDots';
import { PlayerSheet } from '@/components/PlayerSheet';
import { Podium } from '@/components/Podium';
import { SegmentedTabs } from '@/components/SegmentedTabs';
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
  useDeleteTournament,
  useFinishTournament,
  useStartTournament,
  useTournament,
} from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';
import type { Match, StandingRow } from '@/lib/types';

type TabKey = 'table' | 'matches' | 'players' | 'stats';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'table', label: 'Table' },
  { key: 'matches', label: 'Matches' },
  { key: 'players', label: 'Players' },
  { key: 'stats', label: 'Stats' },
];

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
  tone: 'accent' | 'purple' | 'gold';
}) {
  const color = tone === 'gold' ? colors.gold : tone === 'purple' ? colors.purple : colors.accent;
  const background =
    tone === 'gold' ? colors.goldSoft : tone === 'purple' ? colors.purpleSoft : colors.accentSoft;

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
  const start = useStartTournament(id ?? '');
  const finish = useFinishTournament(id ?? '');
  const remove = useDeleteTournament();

  const [tab, setTab] = useState<TabKey>('table');
  const [detailedTable, setDetailedTable] = useState(false);
  const [selected, setSelected] = useState<StandingRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'start' | 'finish' | 'delete'>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const openConfirm = (kind: 'start' | 'finish' | 'delete') => {
    setConfirm(kind);
    setConfirmVisible(true);
  };

  const tournament = data?.tournament;
  const participants = data?.participants ?? [];
  const matches = data?.matches ?? [];
  const standings = data?.standings ?? [];

  const isCreator = Boolean(user && tournament && user.id === tournament.creatorId);
  const isMember = data?.isMember ?? false;
  const playedCount = matches.filter((match) => match.status === 'PLAYED').length;
  const meta = tournament ? statusMeta(tournament.status) : null;

  const teamById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant.teamName])),
    [participants],
  );

  const matchdays = useMemo(() => {
    const groups = new Map<number, Match[]>();
    for (const match of matches) {
      const list = groups.get(match.matchday) ?? [];
      list.push(match);
      groups.set(match.matchday, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const stats = useMemo(() => {
    if (standings.length === 0) return null;
    const bestAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    const withGames = standings.filter((row) => row.played > 0);
    const bestDefense = [...(withGames.length > 0 ? withGames : standings)].sort(
      (a, b) => a.goalsAgainst - b.goalsAgainst,
    )[0];
    const mostWins = [...standings].sort((a, b) => b.won - a.won)[0];
    const totalGoals = standings.reduce((sum, row) => sum + row.goalsFor, 0);
    return { bestAttack, bestDefense, mostWins, totalGoals };
  }, [standings]);

  const copyCode = async () => {
    if (!tournament?.code) return;
    await Clipboard.setStringAsync(tournament.code);
    Haptics.selectionAsync().catch(() => undefined);
    toast.show(`Code ${tournament.code} copied`, 'success');
  };

  const shareInvite = async () => {
    if (!tournament?.code) {
      toast.show('Join code is only visible to participants', 'info');
      return;
    }
    await Share.share({
      message: `Join my PES League tournament "${tournament.name}"!\n\nOpen PES League, tap Join, and enter code: ${tournament.code}`,
    }).catch(() => undefined);
  };

  const actions: SheetAction[] = [];
  if (isCreator && tournament?.status === 'DRAFT') {
    actions.push({
      label: 'Start tournament',
      icon: 'play',
      onPress: () => openConfirm('start'),
    });
  }
  if (isCreator && tournament?.status === 'ACTIVE') {
    actions.push({
      label: 'Finish tournament',
      icon: 'flag',
      onPress: () => openConfirm('finish'),
    });
  }
  if (isMember && tournament?.code) {
    actions.push({ label: 'Copy join code', icon: 'copy-outline', onPress: copyCode });
    actions.push({ label: 'Share invite', icon: 'share-social-outline', onPress: shareInvite });
  }
  if (isCreator) {
    actions.push({
      label: 'Delete tournament',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => openConfirm('delete'),
    });
  }

  const handleConfirm = () => {
    if (confirm === 'start') {
      start.mutate(undefined, {
        onSuccess: (result) => {
          setConfirmVisible(false);
          toast.show(`Fixtures created · ${result.matchesCreated} matches`, 'success');
        },
        onError: (caught) => {
          setConfirmVisible(false);
          toast.show(caught instanceof Error ? caught.message : 'Could not start', 'error');
        },
      });
    }

    if (confirm === 'finish') {
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
    }

    if (confirm === 'delete') {
      remove.mutate(id, {
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
    }
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
          {actions.length > 0 ? (
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
          <Animated.View entering={FadeInDown.duration(380)}>
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
                  {participants.length} players · {playedCount}/{matches.length} played
                </Text>
              </View>

              {tournament.description ? (
                <Text style={styles.description}>{tournament.description}</Text>
              ) : null}

              <Text style={styles.created}>Created {formatDate(tournament.createdAt)}</Text>

              {tournament.status === 'DRAFT' && tournament.code ? (
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
              ) : null}

              {tournament.status === 'DRAFT' && !tournament.code ? (
                <Text style={styles.hint}>
                  The join code is only visible to participants of this tournament.
                </Text>
              ) : null}

              {tournament.status === 'ACTIVE' ? (
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            matches.length > 0 ? (playedCount / matches.length) * 100 : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {playedCount} of {matches.length} matches played
                  </Text>
                </View>
              ) : null}

              {tournament.status === 'DRAFT' && isCreator ? (
                <PrimaryButton
                  label="Start tournament"
                  icon="play"
                  loading={start.isPending}
                  disabled={participants.length < 2}
                  onPress={() => openConfirm('start')}
                  style={{ marginTop: spacing.lg }}
                />
              ) : null}

              {tournament.status === 'DRAFT' && !isCreator ? (
                <Text style={styles.hint}>
                  Waiting for the creator to start the league.
                </Text>
              ) : null}

              {tournament.status === 'DRAFT' && !isMember ? (
                <PrimaryButton
                  label="Join with code"
                  icon="enter-outline"
                  onPress={() => router.push('/join')}
                  style={{ marginTop: spacing.md }}
                />
              ) : null}

              {tournament.status === 'DRAFT' && isCreator && participants.length < 2 ? (
                <Text style={styles.hint}>
                  Share the code — you need at least 2 players to start.
                </Text>
              ) : null}
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(380)}>
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
          </Animated.View>

          <View style={{ marginTop: spacing.xl }}>
            <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            {tab === 'table' ? (
              standings.length > 0 ? (
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
                      style={({ pressed }) => [
                        styles.tableToggle,
                        pressed && { opacity: 0.7 },
                      ]}
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
                    message="Players and results will appear here once the league starts."
                  />
                </Card>
              )
            ) : null}

            {tab === 'matches' ? (
              matchdays.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="football-outline"
                    title="No fixtures yet"
                    message="Fixtures are generated automatically when the creator starts the tournament."
                  />
                </Card>
              ) : (
                matchdays.map(([day, dayMatches]) => (
                  <View key={day} style={{ marginBottom: spacing.lg }}>
                    <Text style={styles.matchdayLabel}>Matchday {day}</Text>
                    {dayMatches.map((match) => {
                      const homeName = teamById.get(match.homeId) ?? 'Home';
                      const awayName = teamById.get(match.awayId) ?? 'Away';
                      const played = match.status === 'PLAYED';
                      const canEdit = isMember && tournament.status === 'ACTIVE';

                      const routeParams = played
                        ? {
                            id: match.id,
                            tournamentId: id,
                            matchId: match.id,
                            home: homeName,
                            away: awayName,
                            homeScore: String(match.homeScore),
                            awayScore: String(match.awayScore),
                            matchday: String(match.matchday),
                          }
                        : {
                            id: match.id,
                            tournamentId: id,
                            matchId: match.id,
                            home: homeName,
                            away: awayName,
                            matchday: String(match.matchday),
                          };

                      return (
                        <Pressable
                          key={match.id}
                          disabled={!canEdit}
                          onPress={() =>
                            router.push({ pathname: '/match/[id]', params: routeParams })
                          }
                          style={({ pressed }) => [
                            styles.matchCard,
                            pressed && canEdit && { opacity: 0.8, transform: [{ scale: 0.99 }] },
                          ]}
                        >
                          <Text style={styles.matchTeamName} numberOfLines={2}>
                            {homeName}
                          </Text>
                          <View style={styles.matchScore}>
                            {played ? (
                              <Text style={styles.matchScoreText}>
                                {match.homeScore} - {match.awayScore}
                              </Text>
                            ) : (
                              <Text style={styles.matchVs}>VS</Text>
                            )}
                          </View>
                          <Text
                            style={[styles.matchTeamName, { textAlign: 'right' }]}
                            numberOfLines={2}
                          >
                            {awayName}
                          </Text>
                          {canEdit ? (
                            <View style={styles.matchEdit}>
                              <Ionicons name="create-outline" size={13} color={colors.textMuted} />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              )
            ) : null}

            {tab === 'players' ? (
              standings.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="people-outline"
                    title="No players yet"
                    message="Share the join code to invite competitors."
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
                      tone={row.position === 1 ? 'gold' : 'accent'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerTeam}>{row.teamName}</Text>
                      <Text style={styles.playerMeta}>
                        @{row.nickname} · {row.firstName}
                      </Text>
                    </View>
                    <View style={styles.playerStats}>
                      <Text style={styles.playerPts}>
                        {row.points}
                        <Text style={styles.playerPtsLabel}> pts</Text>
                      </Text>
                      <Text style={styles.playerRecord}>
                        {row.won}W {row.drawn}D {row.lost}L
                      </Text>
                    </View>
                  </Pressable>
                ))
              )
            ) : null}

            {tab === 'stats' ? (
              !stats ? (
                <Card>
                  <EmptyState
                    icon="stats-chart-outline"
                    title="No stats yet"
                    message="Record some results and the league stats will light up."
                  />
                </Card>
              ) : (
                <>
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
                      team={`${matches.length} matches`}
                      value={`${stats.totalGoals}`}
                      tone="accent"
                    />
                  </View>

                  <SectionTitle
                    title="Form guide"
                    subtitle="Last 5 results per team"
                    right={undefined}
                  />
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
                        {index < standings.length - 1 ? (
                          <View style={styles.formDivider} />
                        ) : null}
                      </View>
                    ))}
                  </Card>
                </>
              )
            ) : null}
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
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
          confirm === 'start'
            ? 'Start the league?'
            : confirm === 'finish'
              ? 'Finish the tournament?'
              : 'Delete this tournament?'
        }
        message={
          confirm === 'start'
            ? `This creates ${(participants.length * (participants.length - 1)) / 2} round-robin fixtures and locks new players out.`
            : confirm === 'finish'
              ? 'The final table will be saved. Results can no longer be edited.'
              : 'This permanently deletes the tournament, its matches and results for everyone.'
        }
        confirmLabel={
          confirm === 'start' ? 'Start' : confirm === 'finish' ? 'Finish' : 'Delete'
        }
        destructive={confirm === 'delete'}
        loading={start.isPending || finish.isPending || remove.isPending}
        icon={
          confirm === 'delete'
            ? 'trash-outline'
            : confirm === 'finish'
              ? 'flag-outline'
              : 'play-outline'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />

      <PlayerSheet row={selected} onClose={() => setSelected(null)} />
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
  progressWrap: {
    marginTop: spacing.lg,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  matchdayLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  matchTeamName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  matchScore: {
    paddingHorizontal: spacing.md,
    minWidth: 72,
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
  matchEdit: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  playerTeam: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  playerPts: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  playerPtsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  playerRecord: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
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
