import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import {
  Avatar,
  Card,
  IconButton,
  Pill,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSetResult } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

function ScorePanel({
  name,
  value,
  onStep,
}: {
  name: string;
  value: number;
  onStep: (delta: number) => void;
}) {
  return (
    <View style={styles.panel}>
      <Avatar name={name} size={46} tone="accent" />
      <Text style={styles.teamName} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.controls}>
        <IconButton
          icon="remove"
          size={38}
          accessibilityLabel={`Decrease ${name} score`}
          onPress={() => onStep(-1)}
        />
        <Text style={styles.score}>{value}</Text>
        <IconButton
          icon="add"
          size={38}
          accessibilityLabel={`Increase ${name} score`}
          onPress={() => onStep(1)}
        />
      </View>
    </View>
  );
}

export default function EditScoreScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{
    tournamentId: string;
    matchId: string;
    home: string;
    away: string;
    homeScore?: string;
    awayScore?: string;
  }>();

  const tournamentId = params.tournamentId;
  const matchId = params.matchId;

  const [homeScore, setHomeScore] = useState(Number(params.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(Number(params.awayScore ?? 0));
  const [error, setError] = useState<string | null>(null);

  const setResult = useSetResult(tournamentId);

  const save = () => {
    setError(null);
    setResult.mutate(
      { matchId, homeScore, awayScore },
      {
        onSuccess: () => {
          toast.show('Score updated', 'success');
          router.back();
        },
        onError: (caught) => {
          setError(caught instanceof ApiError ? caught.message : 'Could not save the score.');
        },
      },
    );
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Edit score</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metaRow}>
            <Pill
              label="Played"
              color={colors.accent}
              background={colors.accentSoft}
              dot
            />
          </View>

          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <ScorePanel
              name={params.home ?? 'Home'}
              value={homeScore}
              onStep={(delta) =>
                setHomeScore((current) => Math.min(99, Math.max(0, current + delta)))
              }
            />
            <View style={styles.vs}>
              <Text style={styles.vsText}>:</Text>
            </View>
            <ScorePanel
              name={params.away ?? 'Away'}
              value={awayScore}
              onStep={(delta) =>
                setAwayScore((current) => Math.min(99, Math.max(0, current + delta)))
              }
            />
          </LinearGradient>

          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
              <Text style={styles.note}>
                Only the two players in this match or the admin can edit the score. Save and the
                table updates for everyone.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Save score"
              icon="checkmark"
              loading={setResult.isPending}
              onPress={save}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  panel: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 36,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  score: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900',
    minWidth: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  vs: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.lg,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '700',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
});
