import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import { useSheetSlideIn } from '@/lib/useSheetSlideIn';

export type SheetAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export function ActionSheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slideIn = useSheetSlideIn(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            slideIn,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose();
                setTimeout(action.onPress, 180);
              }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardAlt }]}
            >
              <View
                style={[
                  styles.rowIcon,
                  {
                    backgroundColor: action.destructive
                      ? colors.dangerSoft
                      : colors.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={action.destructive ? colors.danger : colors.accent}
                />
              </View>
              <Text
                style={[styles.rowLabel, action.destructive && { color: colors.danger }]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 5, 10, 0.7)',
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
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelLabel: {
    color: colors.textDim,
    fontSize: 15,
    fontWeight: '700',
  },
});
