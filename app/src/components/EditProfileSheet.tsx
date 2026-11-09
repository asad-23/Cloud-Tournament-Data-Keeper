import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';
import { Field, PrimaryButton } from './ui';

export function EditProfileSheet({
  visible,
  firstName,
  nickname,
  loading = false,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  firstName: string;
  nickname: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (body: { firstName: string; nickname: string }) => void;
}) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(firstName);
  const [handle, setHandle] = useState(nickname);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const cleanName = name.trim();
    const cleanHandle = handle.trim();

    if (cleanName.length === 0) {
      setLocalError('Enter your first name.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanHandle)) {
      setLocalError('Nickname must be 3–20 letters, numbers or underscores.');
      return;
    }

    setLocalError(null);
    onSubmit({ firstName: cleanName, nickname: cleanHandle });
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
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Edit profile</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Your first name is the player name shown in tournaments.
          </Text>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="First name"
              icon="person-outline"
              placeholder="e.g. John"
              autoCapitalize="words"
              maxLength={30}
              value={name}
              onChangeText={setName}
              style={{ marginTop: spacing.lg }}
            />
            <Field
              label="Nickname"
              icon="at-outline"
              placeholder="e.g. john_10"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              value={handle}
              onChangeText={setHandle}
              onSubmitEditing={submit}
              returnKeyType="done"
              style={{ marginTop: spacing.lg }}
            />

            {message ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{message}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Save changes"
              icon="checkmark"
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
    maxHeight: '100%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: spacing.xs,
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
    lineHeight: 18,
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
