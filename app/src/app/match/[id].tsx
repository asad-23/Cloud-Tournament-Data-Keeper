import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Avatar,
  Card,
  IconButton,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useResetResult, useSetResult } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

function ScorePanel({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
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
          onPress={() => onChange(Math.max(0, value - 1))}
        />
        <Text style={styles.score}>{value}</Text>
        <IconButton
          icon="add"
          size={38}
          accessibilityLabel={`Increase ${name} score`}
          onPress={() => onChange(Math.min(99, value + 1))}
        />
      </View>
    </View>
  );
}

export default function RecordResultScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{
    tournamentId: string;
    matchId: string;
    home: string;
    away: string;
    homeScore?: string;
    awayScore?: string;
    matchday?: string;
  }>();

  const tournamentId = params.tournamentId;
  const matchId = params.matchId;
  const hadResult = params.homeScore !== undefined && params.awayScore !== undefined;

  const [homeScore, setHomeScore] = useState(Number(params.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(Number(params.awayScore ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const setResult = useSetResult(tournamentId);
  const resetResult = useResetResult(tournamentId);

  const save = () => {
    setError(null);
    setResult.mutate(
      { matchId, homeScore, awayScore },
      {
        onSuccess: () => {
          toast.show('Result saved', 'success');
          router.back();
        },
        onError: (caught) => {
          setError(caught instanceof ApiError ? caught.message : 'Could not save the result.');
        },
      },
    );
  };

  const clear = () => {
    setError(null);
    resetResult.mutate(matchId, {
      onSuccess: () => {
        setConfirmReset(false);
        toast.show('Result cleared', 'info');
        router.back();
      },
      onError: (caught) => {
        setConfirmReset(false);
        setError(caught instanceof ApiError ? caught.message : 'Could not clear the result.');
      },
    });
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Record result</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(360)} style={styles.metaRow}>
            <Pill
              label={`Matchday ${params.matchday ?? '1'}`}
              color={colors.textDim}
              background="rgba(255,255,255,0.06)"
            />
            <Pill
              label={hadResult ? 'Edit result' : 'Scheduled'}
              color={hadResult ? colors.warning : colors.accent}
              background={hadResult ? 'rgba(255,176,32,0.12)' : colors.accentSoft}
              dot
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(360)}>
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreCard}
            >
              <ScorePanel name={params.home ?? 'Home'} value={homeScore} onChange={setHomeScore} />
              <View style={styles.vs}>
                <Text style={styles.vsText}>:</Text>
              </View>
              <ScorePanel name={params.away ?? 'Away'} value={awayScore} onChange={setAwayScore} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(360)}>
            <Card style={{ marginTop: spacing.lg }}>
              <View style={styles.noteRow}>
                <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
                <Text style={styles.note}>
                  Any participant can record a result. Tap save and the league table updates
                  for everyone.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label={hadResult ? 'Update result' : 'Save result'}
                icon="checkmark"
                loading={setResult.isPending}
                onPress={save}
                style={{ marginTop: spacing.lg }}
              />

              {hadResult ? (
                <SecondaryButton
                  label="Clear result"
                  icon="trash-outline"
                  onPress={() => setConfirmReset(true)}
                  loading={resetResult.isPending}
                  style={{ marginTop: spacing.md }}
                />
              ) : null}
            </Card>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmReset}
        title="Clear this result?"
        message="The match will go back to scheduled and the standings will be recalculated."
        confirmLabel="Clear result"
        destructive
        icon="trash-outline"
        onConfirm={clear}
        onCancel={() => setConfirmReset(false)}
      />
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
