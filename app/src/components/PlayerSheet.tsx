import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import type { StandingRow } from '@/lib/types';
import { FormDots } from './FormDots';
import { Avatar, Divider, Pill } from './ui';

function ActionButton({
  icon,
  label,
  tone = 'default',
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'danger' | 'accent';
  onPress: () => void;
}) {
  const color =
    tone === 'danger' ? colors.danger : tone === 'accent' ? colors.accent : colors.text;
  const background =
    tone === 'danger' ? colors.dangerSoft : tone === 'accent' ? colors.accentSoft : colors.cardAlt;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: background },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.actionLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PlayerSheet({
  row,
  isAdmin = false,
  onClose,
  onLink,
  onToggleDisabled,
  onDelete,
}: {
  row: StandingRow | null;
  isAdmin?: boolean;
  onClose: () => void;
  onLink?: () => void;
  onToggleDisabled?: () => void;
  onDelete?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isGuest = row ? !row.userId : false;

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
            entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
          >
            <View style={styles.handle} />

            <View style={styles.head}>
              <Avatar
                name={row.teamName}
                size={54}
                tone={row.position === 1 ? 'gold' : row.disabled ? 'purple' : 'accent'}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.team}>{row.teamName}</Text>
                <Text style={styles.nickname}>
                  @{row.nickname}
                  {row.firstName ? ` · ${row.firstName}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Pill
                  label={`#${row.position}`}
                  color={row.position === 1 ? colors.gold : colors.textDim}
                  background={row.position === 1 ? colors.goldSoft : 'rgba(255,255,255,0.06)'}
                />
                {row.disabled ? (
                  <Pill label="Inactive" color={colors.warning} background="rgba(255,176,32,0.12)" />
                ) : null}
              </View>
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
                [
                  'Goal diff',
                  row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference,
                ],
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

            {isAdmin ? (
              <View style={styles.adminBlock}>
                <Text style={styles.adminTitle}>Admin actions</Text>
                <View style={styles.actions}>
                  {isGuest ? (
                    <ActionButton
                      icon="link-outline"
                      label="Link account"
                      tone="accent"
                      onPress={onLink ?? (() => undefined)}
                    />
                  ) : null}
                  <ActionButton
                    icon={row.disabled ? 'play-circle-outline' : 'pause-circle-outline'}
                    label={row.disabled ? 'Enable' : 'Disable'}
                    onPress={onToggleDisabled ?? (() => undefined)}
                  />
                  <ActionButton
                    icon="trash-outline"
                    label="Delete"
                    tone="danger"
                    onPress={onDelete ?? (() => undefined)}
                  />
                </View>
                {isGuest ? (
                  <Text style={styles.adminHint}>
                    Added by the admin. Link their account to hand over this player and its
                    stats.
                  </Text>
                ) : null}
              </View>
            ) : null}

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
  adminBlock: {
    marginTop: spacing.xl,
  },
  adminTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  adminHint: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.sm,
  },
  close: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
