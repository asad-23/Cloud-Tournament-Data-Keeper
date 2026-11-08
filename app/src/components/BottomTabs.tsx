import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';

export type BottomTabItem<T extends string> = {
  key: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function BottomTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: BottomTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => undefined);
              onChange(tab.key);
            }}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={active ? colors.accent : colors.textMuted}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.accent,
  },
});
