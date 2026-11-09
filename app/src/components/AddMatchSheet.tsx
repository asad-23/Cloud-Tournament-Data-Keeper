import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import type { Participant } from '@/lib/types';
import { IconButton, PrimaryButton } from './ui';

function PlayerChips({
  players,
  selectedId,
  onSelect,
  tone,
}: {
  players: Participant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  tone: 'accent' | 'purple';
}) {
  const color = tone === 'accent' ? colors.accent : colors.purple;
  const background = tone === 'accent' ? colors.accentSoft : colors.purpleSoft;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {players.map((player) => {
        const selected = player.id === selectedId;
        return (
          <Pressable
            key={player.id}
            onPress={() => onSelect(player.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && { backgroundColor: background, borderColor: color },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.chipLabel, selected && { color }]} numberOfLines={1}>
              {player.teamName}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ScoreStepper({
  value,
  onStep,
  label,
}: {
  value: number;
  onStep: (delta: number) => void;
  label: string;
}) {
  return (
    <View style={styles.scoreBlock}>
      <Text style={styles.scoreLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.scoreRow}>
        <IconButton
          icon="remove"
          size={36}
          accessibilityLabel={`Decrease ${label} score`}
          onPress={() => onStep(-1)}
        />
        <Text style={styles.score}>{value}</Text>
        <IconButton
          icon="add"
          size={36}
          accessibilityLabel={`Increase ${label} score`}
          onPress={() => onStep(1)}
        />
      </View>
    </View>
  );
}

export function AddMatchSheet({
  visible,
  players,
  loading = false,
  error,
  onClose,
  onSubmit,
  bottomOffset = 0,
}: {
  visible: boolean;
  players: Participant[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  bottomOffset?: number;
  onSubmit: (body: {
    homeId: string;
    awayId: string;
    homeScore: number;
    awayScore: number;
  }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [homeId, setHomeId] = useState<string | null>(null);
  const [awayId, setAwayId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (!homeId || !awayId) {
      setLocalError('Pick a player for both sides.');
      return;
    }
    if (homeId === awayId) {
      setLocalError('Pick two different players.');
      return;
    }
    setLocalError(null);
    onSubmit({ homeId, awayId, homeScore, awayScore });
  };

  const message = error ?? localError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              marginBottom: Math.max(bottomOffset, 0),
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add match</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Pick two players and enter the final score.</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={styles.sectionLabel}>Home player</Text>
            <PlayerChips
              players={players}
              selectedId={homeId}
              onSelect={(id) => {
                setHomeId(id);
                if (awayId === id) setAwayId(null);
                setLocalError(null);
              }}
              tone="accent"
            />

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Away player</Text>
            <PlayerChips
              players={players}
              selectedId={awayId}
              onSelect={(id) => {
                setAwayId(id);
                if (homeId === id) setHomeId(null);
                setLocalError(null);
              }}
              tone="purple"
            />

            <View style={styles.scoreCard}>
              <ScoreStepper
                value={homeScore}
                onStep={(delta) =>
                  setHomeScore((current) => Math.min(99, Math.max(0, current + delta)))
                }
                label={
                  players.find((player) => player.id === homeId)?.teamName ?? 'Home'
                }
              />
              <Text style={styles.colon}>:</Text>
              <ScoreStepper
                value={awayScore}
                onStep={(delta) =>
                  setAwayScore((current) => Math.min(99, Math.max(0, current + delta)))
                }
                label={
                  players.find((player) => player.id === awayId)?.teamName ?? 'Away'
                }
              />
            </View>

            {message ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{message}</Text>
              </View>
            ) : null}
          </ScrollView>

          <PrimaryButton
            label="Save match"
            icon="checkmark"
            loading={loading}
            onPress={submit}
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 5, 10, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  body: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxWidth: 160,
  },
  chipLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 110,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    minWidth: 38,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
});
