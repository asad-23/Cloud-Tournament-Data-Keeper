import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditProfileSheet } from '@/components/EditProfileSheet';
import { useToast } from '@/components/Toast';
import { Avatar, Card, Divider, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUpdateProfile } from '@/lib/queries';
import { colors, gradients, radius, spacing } from '@/lib/theme';

const STEPS = [
  {
    icon: 'add-circle-outline' as const,
    title: 'Create a tournament',
    text: 'Pick a tournament name and play as yourself. You get a 6-character code.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Share the code',
    text: 'Friends enter it in Join to become competitors.',
  },
  {
    icon: 'football-outline' as const,
    title: 'Play and record',
    text: 'Add matches, enter scores, and the table updates instantly.',
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const closeEdit = () => {
    setEditOpen(false);
    updateProfile.reset();
  };

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

          <View>
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
          </View>

          <View>
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
          </View>

          <View>
            <SectionTitle title="Account" />
            <Card>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit name and nickname"
                onPress={() => setEditOpen(true)}
                style={({ pressed }) => [styles.editRow, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.editIcon}>
                  <Ionicons name="create-outline" size={17} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editLabel}>Edit profile</Text>
                  <Text style={styles.editHint}>Change your first name or nickname</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
              <Divider style={{ marginVertical: spacing.md }} />
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
          </View>

          <View>
            <PrimaryButton
              label="Sign out"
              icon="log-out-outline"
              tone="danger"
              onPress={() => setConfirmVisible(true)}
              style={{ marginTop: spacing.xl }}
            />
            <Text style={styles.version}>PlaDa · Playful Cloud Data · v1.0.0</Text>
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>

      <EditProfileSheet
        key={editOpen ? 'edit-profile-open' : 'edit-profile-closed'}
        visible={editOpen}
        firstName={user?.firstName ?? ''}
        nickname={user?.nickname ?? ''}
        loading={updateProfile.isPending}
        error={updateProfile.error instanceof Error ? updateProfile.error.message : null}
        bottomOffset={49 + insets.bottom}
        onClose={closeEdit}
        onSubmit={(body) =>
          updateProfile.mutate(body, {
            onSuccess: () => {
              setEditOpen(false);
              toast.show('Profile updated', 'success');
            },
          })
        }
      />

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
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  editHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
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
