import { StyleSheet, Text, View } from 'react-native';
import { resultColor } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { FormResult } from '@/lib/types';

export function FormDots({
  form,
  size = 17,
  emptyLabel = '—',
}: {
  form: FormResult[];
  size?: number;
  emptyLabel?: string;
}) {
  if (form.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.row}>
      {form.map((result, index) => (
        <View
          key={`${result}-${index}`}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size * 0.3,
              backgroundColor: resultColor(result),
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.58 }]}>{result}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#04120C',
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
