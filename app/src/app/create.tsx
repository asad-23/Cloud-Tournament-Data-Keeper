import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useToast } from '@/components/Toast';
import {
  Card,
  Field,
  IconButton,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useCreateTournament } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

type Created = { id: string; name: string; code: string };

export default function CreateTournamentScreen() {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateTournament();

  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const submit = () => {
    setError(null);

    if (name.trim().length < 3) {
      setError('Tournament name must be at least 3 characters.');
      return;
    }
    if (teamName.trim().length < 1) {
      setError('Enter the team name you will use.');
      return;
    }

    create.mutate(
      {
        name: name.trim(),
        teamName: teamName.trim(),
        description: description.trim() || undefined,
        maxPlayers,
      },
      {
        onSuccess: (result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => undefined,
          );
          setCreated({
            id: result.tournament.id,
            name: result.tournament.name,
            code: result.tournament.code,
          });
        },
        onError: (caught) => {
          setError(caught instanceof ApiError ? caught.message : 'Could not create tournament.');
        },
      },
    );
  };

  const copyCode = async () => {
    if (!created) return;
    await Clipboard.setStringAsync(created.code);
    Haptics.selectionAsync().catch(() => undefined);
    toast.show(`Code ${created.code} copied`, 'success');
  };

  const shareCode = async () => {
    if (!created) return;
    await Share.share({
      message: `Join my PES League tournament "${created.name}"!\n\nOpen PES League, tap Join, and enter code: ${created.code}`,
    }).catch(() => undefined);
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{created ? 'Ready to share' : 'Create tournament'}</Text>
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
            {created ? (
              <View style={styles.successWrap}>
                <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.successIcon}>
                  <Ionicons name="checkmark" size={34} color="#04120C" />
                </Animated.View>

                <Animated.Text entering={FadeInDown.delay(80)} style={styles.successTitle}>
                  {created.name}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(120)} style={styles.successText}>
                  Tournament created. Share this code so your friends can join.
                </Animated.Text>

                <Animated.View entering={FadeInDown.delay(180)} style={{ width: '100%' }}>
                  <LinearGradient
                    colors={gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.codeCard}
                  >
                    <Text style={styles.codeLabel}>JOIN CODE</Text>
                    <Text style={styles.code}>{created.code}</Text>
                    <View style={styles.codeActions}>
                      <SecondaryButton
                        label="Copy"
                        icon="copy-outline"
                        onPress={copyCode}
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        label="Share"
                        icon="share-outline"
                        onPress={shareCode}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </LinearGradient>

                  <PrimaryButton
                    label="Open tournament"
                    icon="arrow-forward"
                    onPress={() => router.replace(`/tournament/${created.id}`)}
                    style={{ marginTop: spacing.xl }}
                  />
                </Animated.View>
              </View>
            ) : (
              <>
                <Animated.View entering={FadeInDown.duration(360)}>
                  <LinearGradient colors={gradients.hero} style={styles.intro}>
                    <View style={styles.introIcon}>
                      <Ionicons name="trophy" size={22} color={colors.accent} />
                    </View>
                    <Text style={styles.introTitle}>Set up your league</Text>
                    <Text style={styles.introText}>
                      You will be added as the first competitor. A join code is generated
                      automatically.
                    </Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(80).duration(360)}>
                  <Card style={{ marginTop: spacing.lg }}>
                    <Field
                      label="Tournament name"
                      icon="trophy-outline"
                      placeholder="e.g. Friday Night League"
                      maxLength={60}
                      value={name}
                      onChangeText={setName}
                    />
                    <Field
                      label="Your team name"
                      icon="shield-outline"
                      placeholder="e.g. Barcelona"
                      maxLength={30}
                      value={teamName}
                      onChangeText={setTeamName}
                      style={{ marginTop: spacing.lg }}
                    />
                    <Field
                      label="Description (optional)"
                      icon="document-text-outline"
                      placeholder="Rules, prizes, anything…"
                      maxLength={240}
                      multiline
                      value={description}
                      onChangeText={setDescription}
                      style={{ marginTop: spacing.lg }}
                    />

                    <View style={styles.stepperBlock}>
                      <Text style={styles.stepperLabel}>Max players</Text>
                      <View style={styles.stepperRow}>
                        <IconButton
                          icon="remove"
                          size={38}
                          onPress={() => setMaxPlayers((value) => Math.max(2, value - 1))}
                        />
                        <Text style={styles.stepperValue}>{maxPlayers}</Text>
                        <IconButton
                          icon="add"
                          size={38}
                          onPress={() => setMaxPlayers((value) => Math.min(32, value + 1))}
                        />
                      </View>
                    </View>

                    {error ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={16} color={colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <PrimaryButton
                      label="Create tournament"
                      icon="sparkles"
                      loading={create.isPending}
                      onPress={submit}
                      style={{ marginTop: spacing.xl }}
                    />
                  </Card>
                </Animated.View>
              </>
            )}

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
    borderColor: 'rgba(44,229,155,0.16)',
    padding: spacing.lg,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
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
  stepperBlock: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepperLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
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
  successWrap: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  codeCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.25)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  code: {
    color: colors.accent,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: spacing.md,
    marginLeft: 8,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
});
