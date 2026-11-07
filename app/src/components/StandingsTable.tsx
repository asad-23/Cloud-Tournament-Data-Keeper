import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';
import type { StandingRow } from '@/lib/types';
import { FormDots } from './FormDots';

function positionTone(position: number) {
  if (position === 1) return { color: colors.gold, background: colors.goldSoft };
  if (position === 2) return { color: colors.silver, background: 'rgba(199,211,227,0.12)' };
  if (position === 3) return { color: colors.bronze, background: 'rgba(217,138,95,0.12)' };
  return { color: colors.textMuted, background: 'transparent' };
}

export function StandingsTable({
  standings,
  onSelect,
}: {
  standings: StandingRow[];
  onSelect: (row: StandingRow) => void;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, styles.posCol]}>#</Text>
        <Text style={[styles.headerLabel, styles.teamCol]}>Team</Text>
        <Text style={[styles.headerLabel, styles.numCol]}>P</Text>
        <Text style={[styles.headerLabel, styles.numCol]}>GD</Text>
        <Text style={[styles.headerLabel, styles.ptsCol]}>Pts</Text>
      </View>

      {standings.map((row) => {
        const tone = positionTone(row.position);
        return (
          <Pressable
            key={row.participantId}
            onPress={() => onSelect(row)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardAlt }]}
          >
            <View style={styles.posCol}>
              <View style={[styles.posBadge, { backgroundColor: tone.background }]}>
                <Text style={[styles.posText, { color: tone.color }]}>{row.position}</Text>
              </View>
            </View>

            <View style={styles.teamCol}>
              <Text style={styles.teamName} numberOfLines={1}>
                {row.teamName}
              </Text>
              <FormDots form={row.form} size={15} />
            </View>

            <Text style={[styles.cell, styles.numCol]}>{row.played}</Text>
            <Text style={[styles.cell, styles.numCol]}>
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </Text>
            <Text style={[styles.cell, styles.ptsCol, styles.points]}>{row.points}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  headerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  posCol: {
    width: 32,
  },
  teamCol: {
    flex: 1,
    gap: 4,
  },
  numCol: {
    width: 34,
    textAlign: 'center',
  },
  ptsCol: {
    width: 38,
    textAlign: 'right',
  },
  posBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: {
    fontSize: 12,
    fontWeight: '800',
  },
  teamName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cell: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  points: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
