import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, EmptyState, Pill, Screen, SectionTitle } from '@/components/ui';
import { TournamentCard } from '@/components/TournamentCard';
import { useAuth } from '@/lib/auth';
import { useMyTournaments } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching, error } = useMyTournaments();

  const tournaments = data ?? [];
  const liveCount = tournaments.filter((t) => t.status === 'ACTIVE').length;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="trophy" size={15} color={colors.accent} />
            </View>
            <Text style={styles.brand}>PES LEAGUE</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
            <Avatar name={user?.firstName ?? 'Player'} size={40} />
          </Pressable>
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
          <View>
            <Text style={styles.greeting}>Hey, {user?.firstName ?? 'player'} 👋</Text>
            <View style={styles.greetingRow}>
              <Text style={styles.subGreeting}>Ready to play?</Text>
              {liveCount > 0 ? (
                <Pill
                  label={`${liveCount} live`}
                  color={colors.accent}
                  background={colors.accentSoft}
                  dot
                />
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/create')}
              style={({ pressed }) => [styles.actionWrap, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.actionCard, { borderColor: 'rgba(44,229,155,0.25)' }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="add" size={22} color={colors.accent} />
                </View>
                <Text style={styles.actionTitle}>Create</Text>
                <Text style={styles.actionSubtitle}>New tournament</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.push('/join')}
              style={({ pressed }) => [styles.actionWrap, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.purpleSoft }]}>
                  <Ionicons name="key" size={20} color={colors.purple} />
                </View>
                <Text style={styles.actionTitle}>Join</Text>
                <Text style={styles.actionSubtitle}>Enter a code</Text>
              </View>
            </Pressable>
          </View>

          <View>
            <Pressable
              onPress={() => router.push('/explore')}
              style={({ pressed }) => [styles.exploreRow, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.exploreIcon}>
                <Ionicons name="globe-outline" size={19} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exploreTitle}>Explore global tournaments</Text>
                <Text style={styles.exploreSubtitle}>See live tables from other players</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View>
            <SectionTitle
              title="Your tournaments"
              subtitle={
                tournaments.length > 0
                  ? `${tournaments.length} tournament${tournaments.length === 1 ? '' : 's'}`
                  : 'Nothing here yet'
              }
              right={
                tournaments.length > 0 ? (
                  <Pill label={`${tournaments.length}`} color={colors.textDim} />
                ) : undefined
              }
            />

            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : isError ? (
              <View style={styles.errorCard}>
                <Ionicons name="cloud-offline-outline" size={24} color={colors.danger} />
                <Text style={styles.errorTitle}>Could not load tournaments</Text>
                <Text style={styles.errorMessage}>
                  {error instanceof Error ? error.message : 'Check your connection and try again.'}
                </Text>
                <Pressable onPress={() => refetch()} style={styles.retry}>
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              </View>
            ) : tournaments.length === 0 ? (
              <View style={styles.emptyCard}>
                <EmptyState
                  icon="trophy-outline"
                  title="Start your first league"
                  message="Create a tournament and share the code, or join one with a code from a friend."
                />
              </View>
            ) : (
              tournaments.map((tournament) => (
                <View key={tournament.id}>
                  <TournamentCard
                    name={tournament.name}
                    status={tournament.status}
                    subtitle={
                      tournament.myTeamName
                        ? `You · ${tournament.myTeamName}`
                        : `by @${tournament.creator.nickname}`
                    }
                    participantCount={tournament.participantCount}
                    matchCount={tournament.matchCount}
                    onPress={() => router.push(`/tournament/${tournament.id}`)}
                  />
                </View>
              ))
            )}
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  subGreeting: {
    color: colors.textMuted,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionWrap: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 128,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  exploreIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  exploreSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,92,108,0.3)',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  errorMessage: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.sm,
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
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
