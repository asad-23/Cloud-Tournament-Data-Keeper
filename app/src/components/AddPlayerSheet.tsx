import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import { Field, PrimaryButton } from './ui';

export function AddPlayerSheet({
  visible,
  loading = false,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (body: { name: string; nickname?: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (name.trim().length === 0) {
      setLocalError('Enter the player name.');
      return;
    }
    setLocalError(null);
    onSubmit({ name: name.trim(), nickname: nickname.trim() || undefined });
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
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add player</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Add someone without the app. You can link their account later.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field
              label="Player name"
              icon="person-outline"
              placeholder="e.g. Ronaldo"
              maxLength={30}
              value={name}
              onChangeText={setName}
              style={{ marginTop: spacing.lg }}
            />
            <Field
              label="Nickname (optional)"
              icon="at-outline"
              placeholder="e.g. cr7"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              value={nickname}
              onChangeText={setNickname}
              style={{ marginTop: spacing.lg }}
            />

            {message ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{message}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Add player"
              icon="person-add"
              loading={loading}
              onPress={submit}
              style={{ marginTop: spacing.xl }}
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
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
