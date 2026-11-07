import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Field, IconButton, PrimaryButton, Screen } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useJoinTournament } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

export default function JoinTournamentScreen() {
  const router = useRouter();
  const join = useJoinTournament();

  const [code, setCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);

    if (code.trim().length < 4) {
      setError('Enter the code shared by the tournament creator.');
      return;
    }
    if (teamName.trim().length < 1) {
      setError('Enter the team name you will use.');
      return;
    }

    join.mutate(
      { code: code.trim().toUpperCase(), teamName: teamName.trim() },
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(360)}>
              <LinearGradient colors={gradients.hero} style={styles.intro}>
                <View style={styles.introIcon}>
                  <Ionicons name="key" size={22} color={colors.purple} />
                </View>
                <Text style={styles.introTitle}>Got an invite code?</Text>
                <Text style={styles.introText}>
                  Ask the creator for the 6-character code. You join as a competitor with your
                  own team name.
                </Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(360)}>
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

                <Field
                  label="Your team name"
                  icon="shield-outline"
                  placeholder="e.g. Real Madrid"
                  maxLength={30}
                  value={teamName}
                  onChangeText={setTeamName}
                  style={{ marginTop: spacing.lg }}
                />

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
            </Animated.View>

            <Text style={styles.helper}>
              Codes only work while the tournament is in draft. Once it starts, new players
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
