import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.logo}>
            <BrandLogo size={62} />
          </View>
          <Text style={styles.brand}>PlaDa</Text>
          <Text style={styles.tagline}>Playful Cloud Data</Text>
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        </View>
      </Screen>
    );
  }

  return <Redirect href={user ? '/(tabs)' : '/welcome'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
