import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// SecureStore has a 2048-byte per-key limit; Supabase sessions exceed it, so
// we chunk large values across multiple keys and store the chunk count in the
// primary key. Keys like "supabase.auth.token" become:
//   "supabase.auth.token"   → "3"  (chunk count)
//   "supabase.auth.token.0" → first 2000 chars
//   "supabase.auth.token.1" → next 2000 chars
//   "supabase.auth.token.2" → remainder
const CHUNK_SIZE = 2000;
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function readChunked(key: string, meta: string): Promise<string | null> {
  const n = Number(meta);
  if (Number.isNaN(n)) return meta; // legacy single-value written before chunking
  const parts = await Promise.all(
    Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`, OPTIONS)),
  );
  if (parts.some((p) => p === null)) {
    // Partial/corrupt chunks — clear everything so next launch starts clean.
    await deleteChunked(key).catch(() => undefined);
    return null;
  }
  return (parts as string[]).join("");
}

async function writeChunked(key: string, value: string): Promise<void> {
  const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
  await SecureStore.setItemAsync(key, String(chunks.length), OPTIONS);
  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}.${i}`, chunk, OPTIONS)),
  );
}

async function deleteChunked(key: string): Promise<void> {
  const meta = await SecureStore.getItemAsync(key, OPTIONS);
  await SecureStore.deleteItemAsync(key, OPTIONS);
  if (meta !== null && !Number.isNaN(Number(meta))) {
    const n = Number(meta);
    await Promise.all(
      Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS)),
    );
  }
}

export const ExpoSecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const meta = await SecureStore.getItemAsync(key, OPTIONS);
    if (meta !== null) {
      return readChunked(key, meta);
    }
    // One-time migration: move existing AsyncStorage token to SecureStore.
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      try {
        await writeChunked(key, legacy);
        await AsyncStorage.removeItem(key);
      } catch {
        // Migration failed — return legacy token; retry migration next launch.
      }
      return legacy;
    }
    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    await writeChunked(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    await deleteChunked(key);
    await AsyncStorage.removeItem(key); // clean up any leftover legacy value
  },
};
