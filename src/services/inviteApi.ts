import { supabase } from "@/config/supabase";
import { captureException } from "@/services/analytics/sentry";
import { APP_URL_SCHEME } from "@/theme/appBrand";

const CODE_LENGTH = 8;
const CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export type InviteLink = {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
};

export type FriendRow = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
};

export type FriendWithProfile = FriendRow & {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export async function getOrCreateMyInvite(userId: string): Promise<{
  code: string;
  url: string;
} | null> {
  const { data: existing } = await supabase
    .from("invite_links")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.code) {
    const url = buildInviteUrl(existing.code);
    return { code: existing.code, url };
  }

  let code = generateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("invite_links").insert({
      user_id: userId,
      code,
    });
    if (!error) {
      return { code, url: buildInviteUrl(code) };
    }
    if (error.code === "23505") {
      code = generateCode();
      continue;
    }
    return null;
  }
  return null;
}

export function buildInviteUrl(code: string): string {
  return `${APP_URL_SCHEME}://invite/${code}`;
}

export async function resolveInviteCode(code: string): Promise<string | null> {
  const trimmed = code.trim().toLowerCase();
  const { data, error } = await supabase
    .from("invite_links")
    .select("user_id")
    .eq("code", trimmed)
    .maybeSingle();
  if (error) {
    captureException(new Error(error.message), {
      feature: "resolveInviteCode",
      code: trimmed,
      supabaseCode: error.code,
    });
    return null;
  }
  return data?.user_id ?? null;
}

export async function addFriend(myUserId: string, friendUserId: string): Promise<boolean> {
  const { error: e1 } = await supabase.from("friends").insert({
    user_id: myUserId,
    friend_id: friendUserId,
  });
  if (e1 && e1.code !== "23505") {
    captureException(new Error(e1.message), {
      feature: "addFriend",
      step: "insert_my_row",
      myUserId,
      friendUserId,
      supabaseCode: e1.code,
    });
    return false;
  }
  const { error: e2 } = await supabase.from("friends").insert({
    user_id: friendUserId,
    friend_id: myUserId,
  });
  if (e2 && e2.code !== "23505") {
    captureException(new Error(e2.message), {
      feature: "addFriend",
      step: "insert_reciprocal_row",
      myUserId,
      friendUserId,
      supabaseCode: e2.code,
    });
    return false;
  }
  return true;
}

export async function removeFriend(myUserId: string, friendUserId: string): Promise<boolean> {
  const { error: e1 } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", myUserId)
    .eq("friend_id", friendUserId);
  if (e1) {
    captureException(new Error(e1.message), {
      feature: "removeFriend",
      step: "delete_my_row",
      myUserId,
      friendUserId,
      supabaseCode: e1.code,
    });
    return false;
  }
  const { error: e2 } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", friendUserId)
    .eq("friend_id", myUserId);
  if (e2) {
    captureException(new Error(e2.message), {
      feature: "removeFriend",
      step: "delete_reciprocal_row",
      myUserId,
      friendUserId,
      supabaseCode: e2.code,
    });
    return false;
  }
  return true;
}

export async function listMyFriends(userId: string): Promise<FriendWithProfile[]> {
  const { data: rows, error } = await supabase
    .from("friends")
    .select("id, user_id, friend_id, created_at")
    .eq("user_id", userId);
  if (error || !rows?.length) return [];

  const friendIds = rows.map((r) => r.friend_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, username, avatar_url")
    .in("user_id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  return rows.map((row) => {
    const p = profileMap.get(row.friend_id);
    return {
      ...row,
      display_name: p?.display_name ?? null,
      username: p?.username ?? null,
      avatar_url: p?.avatar_url ?? null,
    } as FriendWithProfile;
  });
}
