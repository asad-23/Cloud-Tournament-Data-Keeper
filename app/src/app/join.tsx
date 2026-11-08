import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Card,
  Field,
  IconButton,
  Pill,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useJoinTournament } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

export default function JoinTournamentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const join = useJoinTournament();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);

    if (code.trim().length < 4) {
      setError('Enter the code shared by the tournament creator.');
      return;
    }

    join.mutate(
      { code: code.trim().toUpperCase() },
      {
        onSuccess: (result) => {
          router.replace(`/tournament/${result.tournament.id}`);
        },
        onError: (caught) => {
          setError(caught instanceof ApiError ? caught.message : 'Could not join tournament.');
        },
      },
    );
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Join tournament</Text>
          <View style={{ width: 42 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <LinearGradient colors={gradients.hero} style={styles.intro}>
                <View style={styles.introIcon}>
                  <Ionicons name="key" size={22} color={colors.purple} />
                </View>
                <Text style={styles.introTitle}>Got an invite code?</Text>
                <Text style={styles.introText}>
                  Ask the creator for the 6-character code. You join as a player under your
                  account first name.
                </Text>
              </LinearGradient>
            </View>

            <View>
              <Card style={{ marginTop: spacing.lg }}>
                <Field
                  label="Join code"
                  icon="key-outline"
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  value={code}
                  onChangeText={(value) => setCode(value.toUpperCase().replace(/\s/g, ''))}
                  style={styles.codeField}
                />

                <View style={styles.playerCard}>
                  <Avatar name={user?.firstName ?? 'Player'} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerLabel}>Your player name</Text>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {user?.firstName ?? 'Player'}
                    </Text>
                  </View>
                  <Pill label="You" color={colors.accent} background={colors.accentSoft} />
                </View>
                <Text style={styles.playerHint}>
                  Your account first name is used as your player name in every tournament.
                </Text>

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <PrimaryButton
                  label="Join tournament"
                  icon="enter-outline"
                  loading={join.isPending}
                  onPress={submit}
                  style={{ marginTop: spacing.xl }}
                />
              </Card>
            </View>

            <Text style={styles.helper}>
              Codes work while the tournament is live. Once the admin finishes it, new players
              cannot join.
            </Text>

            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  intro: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,124,255,0.2)',
    padding: spacing.lg,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  introTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  introText: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  codeField: {
    marginTop: spacing.xs,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  playerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  playerHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
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
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
