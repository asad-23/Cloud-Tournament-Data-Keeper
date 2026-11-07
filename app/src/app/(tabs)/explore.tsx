import { Ionicons } from '@expo/vector-icons';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EmptyState, Screen } from '@/components/ui';
import { TournamentCard } from '@/components/TournamentCard';
import { useExplore } from '@/lib/queries';
import { colors, radius, spacing } from '@/lib/theme';

export default function ExploreScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useExplore();

  const tournaments = data ?? [];

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Live tournaments from around the world</Text>
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
          <Animated.View entering={FadeInDown.duration(420)} style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="globe-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Global feed</Text>
              <Text style={styles.bannerText}>
                Anyone with the app can view these tournaments and their standings.
              </Text>
            </View>
          </Animated.View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : isError ? (
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.danger} />
              <Text style={styles.errorTitle}>Could not load the feed</Text>
              <Pressable onPress={() => refetch()} style={styles.retry}>
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : tournaments.length === 0 ? (
            <EmptyState
              icon="globe-outline"
              title="No public tournaments yet"
              message="Once a tournament starts, it shows up here for everyone to follow."
            />
          ) : (
            tournaments.map((tournament, index) => (
              <Animated.View
                key={tournament.id}
                entering={FadeInDown.delay(60 + index * 40).duration(340)}
              >
                <TournamentCard
                  name={tournament.name}
                  status={tournament.status}
                  subtitle={`by @${tournament.creator.nickname}`}
                  participantCount={tournament.participantCount}
                  matchCount={tournament.matchCount}
                  onPress={() => router.push(`/tournament/${tournament.id}`)}
                />
              </Animated.View>
            ))
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.2)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(44,229,155,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  bannerText: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 16,
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
});
