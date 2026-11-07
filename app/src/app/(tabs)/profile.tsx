import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Avatar, Card, Divider, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, gradients, radius, spacing } from '@/lib/theme';

const STEPS = [
  {
    icon: 'add-circle-outline' as const,
    title: 'Create a tournament',
    text: 'Pick a name and your team. You get a 6-character code.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Share the code',
    text: 'Friends enter it in Join to become competitors.',
  },
  {
    icon: 'football-outline' as const,
    title: 'Play and record',
    text: 'Start the league, enter scores, and the table updates instantly.',
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirmVisible(false);
    router.replace('/welcome');
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Profile</Text>

          <Animated.View entering={FadeInDown.duration(420)}>
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <Avatar name={user?.firstName ?? 'Player'} size={64} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.firstName ?? 'Player'}</Text>
                <Text style={styles.nickname}>@{user?.nickname ?? 'unknown'}</Text>
              </View>
              <Pill label="Player" color={colors.accent} background={colors.accentSoft} dot />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <SectionTitle title="How it works" />
            <Card>
              {STEPS.map((step, index) => (
                <View key={step.title}>
                  <View style={styles.step}>
                    <View style={styles.stepIcon}>
                      <Ionicons name={step.icon} size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  {index < STEPS.length - 1 ? <Divider style={{ marginVertical: spacing.md }} /> : null}
                </View>
              ))}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(420)}>
            <SectionTitle title="Account" />
            <Card>
              <View style={styles.infoRow}>
                <Ionicons name="phone-portrait-outline" size={17} color={colors.textDim} />
                <Text style={styles.infoLabel}>Session</Text>
                <Text style={styles.infoValue}>This device</Text>
              </View>
              <Divider style={{ marginVertical: spacing.md }} />
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={17} color={colors.textDim} />
                <Text style={styles.infoLabel}>Login</Text>
                <Text style={styles.infoValue}>Nickname + first name</Text>
              </View>
              {__DEV__ ? (
                <>
                  <Divider style={{ marginVertical: spacing.md }} />
                  <View style={styles.infoRow}>
                    <Ionicons name="server-outline" size={17} color={colors.textDim} />
                    <Text style={styles.infoLabel}>API</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                      {API_BASE}
                    </Text>
                  </View>
                </>
              ) : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(420)}>
            <PrimaryButton
              label="Sign out"
              icon="log-out-outline"
              tone="danger"
              onPress={() => setConfirmVisible(true)}
              style={{ marginTop: spacing.xl }}
            />
            <Text style={styles.version}>PES League · v1.0.0</Text>
          </Animated.View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You can sign back in with your nickname and first name."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.18)',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  nickname: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  stepNumber: {
    color: colors.borderStrong,
    fontSize: 22,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    color: colors.textDim,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  version: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
