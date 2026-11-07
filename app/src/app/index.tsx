import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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
            <Ionicons name="trophy" size={28} color={colors.accent} />
          </View>
          <Text style={styles.brand}>PES LEAGUE</Text>
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
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(44,229,155,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: spacing.lg,
  },
});
