import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
              <Stack.Screen name="tournament/[id]" options={{ animation: 'none' }} />
              <Stack.Screen
                name="create"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="join"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="match/[id]"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
