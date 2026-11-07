import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import type { StandingRow } from '@/lib/types';
import { FormDots } from './FormDots';
import { Avatar, Divider, Pill } from './ui';

export function PlayerSheet({
  row,
  onClose,
}: {
  row: StandingRow | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(row)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {row ? (
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
          >
            <View style={styles.handle} />

            <View style={styles.head}>
              <Avatar name={row.teamName} size={54} tone={row.position === 1 ? 'gold' : 'accent'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.team}>{row.teamName}</Text>
                <Text style={styles.nickname}>
                  @{row.nickname} · {row.firstName}
                </Text>
              </View>
              <Pill
                label={`#${row.position}`}
                color={row.position === 1 ? colors.gold : colors.textDim}
                background={row.position === 1 ? colors.goldSoft : 'rgba(255,255,255,0.06)'}
              />
            </View>

            <Divider style={{ marginVertical: spacing.lg }} />

            <View style={styles.grid}>
              {[
                ['Played', row.played],
                ['Wins', row.won],
                ['Draws', row.drawn],
                ['Losses', row.lost],
                ['Goals for', row.goalsFor],
                ['Goals against', row.goalsAgainst],
                ['Goal diff', row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference],
                ['Points', row.points],
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.statCell}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Last 5</Text>
              <FormDots form={row.form} size={20} emptyLabel="No matches played" />
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </Animated.View>
        ) : null}
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
    paddingHorizontal: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  team: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  nickname: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  statCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  formLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  close: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  closeLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
