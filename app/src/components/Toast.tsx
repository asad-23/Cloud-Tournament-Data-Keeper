import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/lib/theme';

type ToastType = 'success' | 'error' | 'info';
type ToastState = { message: string; type: ToastType } | null;

const ToastContext = createContext<{ show: (message: string, type?: ToastType) => void } | null>(
  null,
);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TONES: Record<ToastType, string> = {
  success: colors.accent,
  error: colors.danger,
  info: colors.purple,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
        {toast ? (
          <Animated.View
            entering={FadeInUp.duration(220).easing(Easing.out(Easing.cubic))}
            exiting={FadeOutUp.duration(150).easing(Easing.in(Easing.cubic))}
            style={[styles.toast, { top: insets.top + spacing.sm }]}
          >
            <Ionicons name={ICONS[toast.type]} size={18} color={TONES[toast.type]} />
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  message: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
