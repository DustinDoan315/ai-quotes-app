import { createClient, type Session } from "@supabase/supabase-js";
import { supabase } from "@/config/supabase";
import { ExpoSecureStorageAdapter } from "@/config/secureStorage";
import { useMemoryStore } from "@/appState/memoryStore";
import { useUserStore } from "@/appState/userStore";
import { loadOwnMemories } from "@/domain/memories/loadOwnMemories";
import { mergeMemories } from "@/domain/memories/mergeMemories";

const STORAGE_KEY = "inkly.pending-guest-merge";
type PendingMerge = {
  sourceUserId: string;
  sourceAccessToken: string;
  sourceRefreshToken: string;
  guestId: string | null;
  targetUserId: string | null;
};
const flights = new Map<string, Promise<boolean>>();

async function readPending(): Promise<PendingMerge | null> {
  const value = await ExpoSecureStorageAdapter.getItem(STORAGE_KEY);
  if (!value) return null;
  const pending = JSON.parse(value) as PendingMerge;
  if (!pending.sourceUserId || !pending.sourceAccessToken || !pending.sourceRefreshToken) {
    throw new Error("The saved guest merge is incomplete.");
  }
  return pending;
}
const savePending = (pending: PendingMerge) =>
  ExpoSecureStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(pending));

/** Save proof before replacing the anonymous session with a returning account. */
export async function rememberGuestMerge(session: Session): Promise<void> {
  if (!session.user.is_anonymous) throw new Error("Only a guest account can be merged.");
  const existing = await readPending();
  if (existing && (existing.sourceUserId !== session.user.id || existing.targetUserId)) {
    throw new Error("Finish the pending guest merge before switching another account.");
  }
  await savePending({
    sourceUserId: session.user.id,
    sourceAccessToken: session.access_token,
    sourceRefreshToken: session.refresh_token,
    guestId: useUserStore.getState().guestId,
    targetUserId: null,
  });
}

/** A successful identity upgrade keeps the guest UUID; no transfer or deletion is needed. */
export async function finishGuestIdentityUpgrade(userId: string): Promise<void> {
  const pending = await readPending();
  if (pending && pending.sourceUserId === userId && pending.targetUserId == null) {
    await ExpoSecureStorageAdapter.removeItem(STORAGE_KEY);
  }
}

export async function bindGuestMergeTarget(targetUserId: string): Promise<void> {
  // An auth listener may already be reading an unbound record. Finish that
  // attempt before binding so the login retry cannot reuse its no-op flight.
  await flights.get(targetUserId)?.catch(() => false);
  const pending = await readPending();
  if (!pending) return;
  if (pending.sourceUserId === targetUserId ||
      (pending.targetUserId && pending.targetUserId !== targetUserId)) {
    throw new Error("This guest merge belongs to a different account.");
  }
  await savePending({ ...pending, targetUserId });
}

async function waitForMemories(): Promise<void> {
  if (useMemoryStore.getState()._hasHydrated) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = useMemoryStore.subscribe((state) => {
      if (state._hasHydrated) { unsubscribe(); resolve(); }
    });
    if (useMemoryStore.getState()._hasHydrated) { unsubscribe(); resolve(); }
  });
}

async function invokeMerge(pending: PendingMerge) {
  const { data, error } = await supabase.functions.invoke("merge-guest-account", {
    body: { sourceUserId: pending.sourceUserId, guestAccessToken: pending.sourceAccessToken },
  });
  let code: string | undefined = data?.error?.code ?? data?.code;
  if (error && !code) {
    try { const body = await error.context?.clone().json(); code = body?.error?.code ?? body?.code; } catch { /* No JSON error body. */ }
  }
  return { data, error, code };
}

async function mergePending(targetUserId: string): Promise<boolean> {
  let pending = await readPending();
  if (!pending || !pending.targetUserId) return false;
  if (pending.targetUserId !== targetUserId) {
    throw new Error("This guest merge belongs to a different account.");
  }
  const { data: auth, error: authError } = await supabase.auth.getSession();
  if (authError || auth.session?.user.id !== targetUserId || auth.session.user.is_anonymous) {
    throw new Error("Sign in to the destination account to finish merging.");
  }
  let result = await invokeMerge(pending);
  if (result.code === "guest_proof_invalid" || result.code === "guest_proof_expired") {
    // This client never saves or publishes a session to the app's auth storage.
    const isolated = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    const { data, error } = await isolated.auth.refreshSession({ refresh_token: pending.sourceRefreshToken });
    if (error || !data.session || data.session.user.id !== pending.sourceUserId || !data.session.user.is_anonymous) {
      throw new Error("Could not renew the guest account proof. Your merge is still saved.");
    }
    pending = { ...pending, sourceAccessToken: data.session.access_token, sourceRefreshToken: data.session.refresh_token };
    await savePending(pending);
    result = await invokeMerge(pending);
  }
  if (result.error || result.data?.merged !== true ||
      result.data.sourceUserId !== pending.sourceUserId || result.data.targetUserId !== targetUserId) {
    throw new Error("Guest memories could not be merged yet. Please retry.");
  }
  const cloud = await loadOwnMemories({ userId: targetUserId, guestId: null });
  await waitForMemories();
  // Recheck after network/hydration: an account switch must never expose these memories.
  const { data: current } = await supabase.auth.getSession();
  if (current.session?.user.id !== targetUserId) throw new Error("Return to the destination account to finish merging.");
  const remapped = useMemoryStore.getState().memories.map(memory =>
    memory.ownerUserId === pending.sourceUserId ||
    (memory.ownerUserId == null && pending.guestId != null && memory.ownerGuestId === pending.guestId)
      ? { ...memory, ownerUserId: targetUserId, ownerGuestId: null }
      : memory,
  );
  useMemoryStore.getState().replaceMemories(mergeMemories(cloud, remapped));
  const memoryOptions = useMemoryStore.persist.getOptions();
  if (memoryOptions.storage) await memoryOptions.storage.setItem(memoryOptions.name ?? "memory-storage", {
    state: memoryOptions.partialize ? memoryOptions.partialize(useMemoryStore.getState()) : useMemoryStore.getState(),
    version: memoryOptions.version,
  });
  if (useUserStore.getState().guestId === pending.guestId) useUserStore.setState({ guestId: null });
  const userOptions = useUserStore.persist.getOptions();
  if (userOptions.storage) await userOptions.storage.setItem(userOptions.name ?? "user-storage", {
    state: userOptions.partialize ? userOptions.partialize(useUserStore.getState()) : useUserStore.getState(),
    version: userOptions.version,
  });
  await ExpoSecureStorageAdapter.removeItem(STORAGE_KEY);
  return true;
}

/** Retry a bound merge after relaunch or network failure; retains proof on failure. */
export function resumeGuestMerge(targetUserId: string): Promise<boolean> {
  const existing = flights.get(targetUserId);
  if (existing) return existing;
  const flight = mergePending(targetUserId).finally(() => { flights.delete(targetUserId); });
  flights.set(targetUserId, flight);
  return flight;
}
