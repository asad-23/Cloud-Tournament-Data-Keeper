import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Field, Pill, PrimaryButton, Screen } from '@/components/ui';
import { API_BASE, ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, gradients, radius, spacing } from '@/lib/theme';

type Mode = 'register' | 'login';

export default function WelcomeScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('register');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    const cleanNickname = nickname.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanNickname)) {
      setError('Nickname must be 3–20 letters, numbers or underscores.');
      return;
    }
    if (firstName.trim().length === 0) {
      setError('Please enter your first name.');
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === 'register'
          ? await api.register({ nickname: cleanNickname, firstName: firstName.trim() })
          : await api.login({ nickname: cleanNickname, firstName: firstName.trim() });

      await signIn(result.token, result.user);
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(500)}>
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.logoRow}>
                  <View style={styles.logo}>
                    <Ionicons name="trophy" size={26} color={colors.accent} />
                  </View>
                  <Pill label="Global · Live" color={colors.accent} background={colors.accentSoft} dot />
                </View>
                <Text style={styles.title}>Run your league.{'\n'}Track every match.</Text>
                <Text style={styles.subtitle}>
                  Create a PES tournament, share the code, and keep the table, results and
                  stats in sync for everyone.
                </Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <Card style={styles.formCard}>
                <View style={styles.modeRow}>
                  {(
                    [
                      { key: 'register', label: 'New here' },
                      { key: 'login', label: 'I have a nickname' },
                    ] as { key: Mode; label: string }[]
                  ).map((item) => {
                    const active = mode === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          setMode(item.key);
                          setError(null);
                        }}
                        style={[styles.modeButton, active && styles.modeButtonActive]}
                      >
                        <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Field
                  label="Nickname"
                  icon="at-outline"
                  placeholder="e.g. asad_10"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  value={nickname}
                  onChangeText={setNickname}
                  returnKeyType="next"
                />

                <Field
                  label="First name"
                  icon="person-outline"
                  placeholder="e.g. Asad"
                  autoCapitalize="words"
                  maxLength={30}
                  value={firstName}
                  onChangeText={setFirstName}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  style={{ marginTop: spacing.lg }}
                />

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <PrimaryButton
                  label={mode === 'register' ? 'Create my profile' : 'Continue'}
                  icon={mode === 'register' ? 'arrow-forward' : 'log-in-outline'}
                  loading={loading}
                  onPress={submit}
                  style={{ marginTop: spacing.xl }}
                />

                <Text style={styles.helper}>
                  {mode === 'register'
                    ? 'No password needed. Your nickname is unique across the app.'
                    : 'Enter the same nickname and first name you registered with.'}
                </Text>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(500)}>
              <View style={styles.footer}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
                <Text style={styles.footerText}>
                  Your session stays on this device. Share the APK with friends — everyone gets
                  their own nickname.
                </Text>
              </View>
              {__DEV__ ? <Text style={styles.devText}>API · {API_BASE}</Text> : null}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.16)',
    padding: spacing.xl,
    overflow: 'hidden',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(44,229,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: spacing.xl,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
    maxWidth: 330,
  },
  formCard: {
    marginTop: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: colors.text,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  devText: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
