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

export function LinkAccountSheet({
  visible,
  playerName,
  loading = false,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  playerName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const clean = nickname.trim();
    if (clean.length < 3) {
      setLocalError('Enter the nickname they registered with.');
      return;
    }
    setLocalError(null);
    onSubmit(clean);
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
            <Text style={styles.title}>Link account</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Connect <Text style={styles.player}>{playerName}</Text> to the account they use in
            the app. Their name, matches and stats stay exactly as they are.
          </Text>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Their nickname"
              icon="at-outline"
              placeholder="e.g. asad_10"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              value={nickname}
              onChangeText={setNickname}
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
              label="Link account"
              icon="link"
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
  player: {
    color: colors.text,
    fontWeight: '700',
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
