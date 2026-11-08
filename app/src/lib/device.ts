import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_KEY = 'pes_league_device_id';

const deviceStorage = {
  get: () =>
    Platform.OS === 'web'
      ? AsyncStorage.getItem(DEVICE_KEY)
      : SecureStore.getItemAsync(DEVICE_KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.setItem(DEVICE_KEY, value)
      : SecureStore.setItemAsync(DEVICE_KEY, value),
};

function randomId(): string {
  const bytes = new Uint8Array(16);
  const cryptoObject = (
    globalThis as {
      crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array };
    }
  ).crypto;

  if (cryptoObject?.getRandomValues) {
    cryptoObject.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

let cached: string | null = null;

/**
 * Stable identifier for this installation. It is created once and never
 * removed on sign-out, which is what makes "one account per device" work.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  const existing = await deviceStorage.get().catch(() => null);
  if (existing) {
    cached = existing;
    return existing;
  }

  const created = randomId();
  await deviceStorage.set(created).catch(() => undefined);
  cached = created;
  return created;
}
