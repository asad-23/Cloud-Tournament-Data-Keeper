import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradients, radius, spacing } from '@/lib/theme';
import type { StandingRow } from '@/lib/types';
import { Avatar } from './ui';

const BAR_HEIGHT = { 1: 88, 2: 66, 3: 54 } as const;

function toneFor(position: number): 'gold' | 'accent' | 'purple' {
  if (position === 1) return 'gold';
  if (position === 2) return 'accent';
  return 'purple';
}

export function Podium({ standings }: { standings: StandingRow[] }) {
  if (standings.length === 0) return null;

  const top = standings.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean) as StandingRow[];

  return (
    <View style={styles.wrap}>
      {order.map((row) => {
        const isChampion = row.position === 1;
        const palette =
          row.position === 1
            ? gradients.gold
            : row.position === 2
              ? gradients.accent
              : gradients.purple;

        return (
          <View key={row.participantId} style={[styles.column, isChampion && styles.championColumn]}>
            {isChampion ? (
              <View style={styles.crown}>
                <Ionicons name="trophy" size={16} color={colors.gold} />
              </View>
            ) : null}
            <Avatar name={row.teamName} size={isChampion ? 54 : 44} tone={toneFor(row.position)} />
            <Text style={styles.team} numberOfLines={1}>
              {row.teamName}
            </Text>
            <Text style={[styles.points, isChampion && { color: colors.gold }]}>
              {row.points} pts
            </Text>
            <LinearGradient
              colors={palette}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bar, { height: BAR_HEIGHT[row.position as 1 | 2 | 3] }]}
            >
              <Text style={styles.position}>{row.position}</Text>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 130,
  },
  championColumn: {
    marginBottom: spacing.sm,
  },
  crown: {
    marginBottom: 4,
  },
  team: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  points: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
  },
  position: {
    color: 'rgba(4,18,12,0.75)',
    fontSize: 20,
    fontWeight: '900',
  },
});
