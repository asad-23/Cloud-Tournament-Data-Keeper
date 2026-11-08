import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pluralize, statusMeta } from '@/lib/format';
import { colors, gradients, radius, spacing } from '@/lib/theme';
import type { TournamentStatus } from '@/lib/types';
import { Pill } from './ui';

export function TournamentCard({
  name,
  status,
  subtitle,
  participantCount,
  matchCount,
  onPress,
}: {
  name: string;
  status: TournamentStatus;
  subtitle: string;
  participantCount: number;
  matchCount: number;
  onPress: () => void;
}) {
  const meta = statusMeta(status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 }]}
    >
      <LinearGradient colors={gradients.card} style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <Ionicons name="trophy" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <Pill label={meta.label} color={meta.color} background={meta.background} dot />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{pluralize(participantCount, 'player')}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="football-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{pluralize(matchCount, 'match')}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  inner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
