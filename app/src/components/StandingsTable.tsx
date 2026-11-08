import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';
import type { StandingRow } from '@/lib/types';
import { FormDots } from './FormDots';

const DETAIL_WIDTHS = {
  pos: 30,
  team: 132,
  played: 28,
  won: 26,
  drawn: 26,
  lost: 26,
  goalsFor: 30,
  goalsAgainst: 30,
  goalDifference: 34,
  points: 36,
} as const;

const DETAIL_TOTAL =
  Object.values(DETAIL_WIDTHS).reduce((sum, width) => sum + width, 0) + spacing.md * 2;

type NumericKey =
  | 'played'
  | 'won'
  | 'drawn'
  | 'lost'
  | 'goalsFor'
  | 'goalsAgainst'
  | 'goalDifference'
  | 'points';

type Column = { key: NumericKey; label: string; width: number; align: 'center' | 'right' };

const COMPACT_COLUMNS: Column[] = [
  { key: 'played', label: 'P', width: 34, align: 'center' },
  { key: 'goalDifference', label: 'GD', width: 34, align: 'center' },
  { key: 'points', label: 'Pts', width: 38, align: 'right' },
];

const DETAIL_COLUMNS: Column[] = [
  { key: 'played', label: 'P', width: DETAIL_WIDTHS.played, align: 'center' },
  { key: 'won', label: 'W', width: DETAIL_WIDTHS.won, align: 'center' },
  { key: 'drawn', label: 'D', width: DETAIL_WIDTHS.drawn, align: 'center' },
  { key: 'lost', label: 'L', width: DETAIL_WIDTHS.lost, align: 'center' },
  { key: 'goalsFor', label: 'GF', width: DETAIL_WIDTHS.goalsFor, align: 'center' },
  { key: 'goalsAgainst', label: 'GA', width: DETAIL_WIDTHS.goalsAgainst, align: 'center' },
  { key: 'goalDifference', label: 'GD', width: DETAIL_WIDTHS.goalDifference, align: 'center' },
  { key: 'points', label: 'Pts', width: DETAIL_WIDTHS.points, align: 'right' },
];

function positionTone(position: number) {
  if (position === 1) return { color: colors.gold, background: colors.goldSoft };
  if (position === 2) return { color: colors.silver, background: 'rgba(199,211,227,0.12)' };
  if (position === 3) return { color: colors.bronze, background: 'rgba(217,138,95,0.12)' };
  return { color: colors.textMuted, background: 'transparent' };
}

function cellValue(row: StandingRow, key: NumericKey): string {
  if (key === 'goalDifference') {
    return row.goalDifference > 0 ? `+${row.goalDifference}` : String(row.goalDifference);
  }
  return String(row[key]);
}

export function StandingsTable({
  standings,
  onSelect,
  detailed = false,
}: {
  standings: StandingRow[];
  onSelect: (row: StandingRow) => void;
  detailed?: boolean;
}) {
  const columns = detailed ? DETAIL_COLUMNS : COMPACT_COLUMNS;
  const teamWidth = detailed ? DETAIL_WIDTHS.team : undefined;
  const posWidth = detailed ? DETAIL_WIDTHS.pos : undefined;

  const table = (
    <View style={detailed ? { minWidth: DETAIL_TOTAL } : undefined}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, posWidth ? { width: posWidth } : styles.posCol]}>#</Text>
        <Text style={[styles.headerLabel, teamWidth ? { width: teamWidth } : styles.teamCol]}>
          Team
        </Text>
        {columns.map((column) => (
          <Text
            key={column.key}
            style={[styles.headerLabel, { width: column.width, textAlign: column.align }]}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {standings.map((row) => {
        const tone = positionTone(row.position);
        return (
          <Pressable
            key={row.participantId}
            onPress={() => onSelect(row)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardAlt }]}
          >
            <View style={posWidth ? { width: posWidth } : styles.posCol}>
              <View style={[styles.posBadge, { backgroundColor: tone.background }]}>
                <Text style={[styles.posText, { color: tone.color }]}>{row.position}</Text>
              </View>
            </View>

            <View
              style={[
                styles.teamCol,
                teamWidth ? { flex: 0, width: teamWidth } : null,
              ]}
            >
              <View style={styles.teamNameRow}>
                <Text
                  style={[styles.teamName, row.disabled && styles.teamNameDisabled]}
                  numberOfLines={1}
                >
                  {row.teamName}
                </Text>
                {row.disabled ? <Text style={styles.inactiveTag}>OFF</Text> : null}
              </View>
              <FormDots form={row.form} size={15} />
            </View>

            {columns.map((column) => (
              <Text
                key={column.key}
                style={[
                  styles.cell,
                  { width: column.width, textAlign: column.align },
                  column.key === 'points' && styles.points,
                ]}
              >
                {cellValue(row, column.key)}
              </Text>
            ))}
          </Pressable>
        );
      })}
    </View>
  );

  if (!detailed) {
    return <View style={styles.table}>{table}</View>;
  }

  return (
    <View style={styles.table}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {table}
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
    flexShrink: 1,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamNameDisabled: {
    color: colors.textMuted,
  },
  inactiveTag: {
    color: colors.warning,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(255,176,32,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
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
