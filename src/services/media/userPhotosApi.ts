import { z } from "zod";
import { supabase } from "@/config/supabase";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import type { HomeVibeKey } from "@/types/homeBackground";
import type { QuoteMemory, QuoteVisibility } from "@/types/memory";
import { formatLocalDateKey } from "@/utils/dateKey";

const quotePhotoRowSchema = z.object({
  id: z.string(),
  image_url: z.string().url(),
  storage_path: z.string().min(1),
  created_at: z.string(),
  quote: z.string().max(180).nullable().optional(),
  user_id: z.string().nullable().optional(),
  guest_id: z.string().nullable().optional(),
  style_font_id: z.string().nullable().optional(),
  style_color_scheme_id: z.string().nullable().optional(),
  home_vibe_key: z.string().nullable().optional(),
  photo_stack_id: z.string().uuid().nullable().optional(),
  visibility: z.enum(["private", "friends", "public"]).default("private"),
  is_favorite: z.boolean().default(false),
});

export type QuotePhotoCard = {
  id: string;
  storagePath: string;
  imageUrl: string;
  quote: string;
  createdAt: string;
  userId: string | null;
  guestId: string | null;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  styleFontId: "small" | "medium" | "large";
  styleColorSchemeId: "light" | "amber" | "pink";
  homeVibeKey: HomeVibeKey | null;
  photoStackId: string | null;
  visibility: QuoteVisibility;
  isFavorite: boolean;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function getSignedPhotoUrlMap(
  rows: { storage_path: string; image_url: string }[],
): Promise<Map<string, string>> {
  const paths = [...new Set(rows.map((row) => row.storage_path))];
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("user-photos")
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      return [path, error ? null : data?.signedUrl ?? null] as const;
    }),
  );
  return new Map(
    results.filter((result): result is readonly [string, string] => result[1] != null),
  );
}

type ListQuotePhotoCardsParams = {
  guestId?: string | null;
  userId?: string | null;
  feedUserIds?: string[];
  limit?: number;
};

export const listQuotePhotoCards = async (
  params: ListQuotePhotoCardsParams,
): Promise<QuotePhotoCard[]> => {
  if (params.feedUserIds && params.feedUserIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("user_photos")
    .select(
      "id, image_url, storage_path, created_at, quote, user_id, guest_id, style_font_id, style_color_scheme_id, home_vibe_key, photo_stack_id, visibility, is_favorite",
    )
    .order("created_at", { ascending: false });

  if (params.feedUserIds && params.feedUserIds.length > 0) {
    query = query.in("user_id", params.feedUserIds);
  } else if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else if (params.guestId) {
    query = query.eq("guest_id", params.guestId);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load quote photo feed", { error });
    throw error;
  }
  if (!data) {
    return [];
  }

  const parsed = z.array(quotePhotoRowSchema).safeParse(data);

  if (!parsed.success) {
    console.error("Failed to parse quote photo feed rows", {
      issues: parsed.error.issues,
    });
    throw new Error("Invalid quote photo feed response");
  }

  const signedPhotoUrls = await getSignedPhotoUrlMap(parsed.data);

  const userIds = [
    ...new Set(
      parsed.data.map((r) => r.user_id).filter((id): id is string => id != null),
    ),
  ];
  let profileMap = new Map<
    string,
    { displayName: string | null; avatarUrl: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", userIds);
    profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        {
          displayName: p.display_name ?? p.username ?? null,
          avatarUrl: p.avatar_url ?? null,
        },
      ]),
    );
  }

  return parsed.data.map((row) => {
    const profile = row.user_id ? profileMap.get(row.user_id) : undefined;
    return {
      id: row.id,
      storagePath: row.storage_path,
      imageUrl: signedPhotoUrls.get(row.storage_path) ?? "",
      createdAt: row.created_at,
      quote: row.quote ?? "",
      userId: row.user_id ?? null,
      guestId: row.guest_id ?? null,
      authorDisplayName: profile?.displayName ?? null,
      authorAvatarUrl: profile?.avatarUrl ?? null,
      styleFontId:
        (row.style_font_id as "small" | "medium" | "large") ?? "medium",
      styleColorSchemeId:
        (row.style_color_scheme_id as "light" | "amber" | "pink") ?? "light",
      homeVibeKey: row.home_vibe_key
        ? getHomeBackgroundPaletteByKey(row.home_vibe_key).vibeKey
        : null,
      photoStackId: row.photo_stack_id ?? null,
      visibility: row.visibility,
      isFavorite: row.is_favorite,
    };
  });
};

type ListQuotePhotoCardsForDayParams = {
  dateKey: string;
  feedUserIds?: string[];
  guestId?: string | null;
  limit?: number;
};

function getUtcDayRange(dateKey: string): { startIso: string; endIso: string } {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export const listQuotePhotoCardsForDay = async (
  params: ListQuotePhotoCardsForDayParams,
): Promise<QuotePhotoCard[]> => {
  const { dateKey, feedUserIds, guestId, limit } = params;
  if (feedUserIds && feedUserIds.length === 0) {
    return [];
  }

  const { startIso, endIso } = getUtcDayRange(dateKey);

  let query = supabase
    .from("user_photos")
    .select(
      "id, image_url, storage_path, created_at, quote, user_id, guest_id, style_font_id, style_color_scheme_id, home_vibe_key, photo_stack_id, visibility, is_favorite",
    )
    .order("created_at", { ascending: false })
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (feedUserIds && feedUserIds.length > 0) {
    query = query.in("user_id", feedUserIds);
  } else if (guestId) {
    query = query.eq("guest_id", guestId);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load quote photo cards for day", { error });
    throw error;
  }
  if (!data) {
    return [];
  }

  const parsed = z.array(quotePhotoRowSchema).safeParse(data);

  if (!parsed.success) {
    console.error("Failed to parse quote photo cards for day rows", {
      issues: parsed.error.issues,
    });
    throw new Error("Invalid quote photo cards for day response");
  }

  const signedPhotoUrls = await getSignedPhotoUrlMap(parsed.data);

  const userIds = [
    ...new Set(
      parsed.data.map((r) => r.user_id).filter((id): id is string => id != null),
    ),
  ];

  let profileMap = new Map<
    string,
    { displayName: string | null; avatarUrl: string | null }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", userIds);

    profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        {
          displayName: p.display_name ?? p.username ?? null,
          avatarUrl: p.avatar_url ?? null,
        },
      ]),
    );
  }

  return parsed.data.map((row) => {
    const profile = row.user_id ? profileMap.get(row.user_id) : undefined;
    return {
      id: row.id,
      storagePath: row.storage_path,
      imageUrl: signedPhotoUrls.get(row.storage_path) ?? "",
      createdAt: row.created_at,
      quote: row.quote ?? "",
      userId: row.user_id ?? null,
      guestId: row.guest_id ?? null,
      authorDisplayName: profile?.displayName ?? null,
      authorAvatarUrl: profile?.avatarUrl ?? null,
      styleFontId:
        (row.style_font_id as "small" | "medium" | "large") ?? "medium",
      styleColorSchemeId:
        (row.style_color_scheme_id as "light" | "amber" | "pink") ?? "light",
      homeVibeKey: row.home_vibe_key
        ? getHomeBackgroundPaletteByKey(row.home_vibe_key).vibeKey
        : null,
      photoStackId: row.photo_stack_id ?? null,
      visibility: row.visibility,
      isFavorite: row.is_favorite,
    };
  });
};

export function quotePhotoCardToMemory(card: QuotePhotoCard): QuoteMemory {
  return {
    id: card.id,
    photoId: card.id,
    ownerUserId: card.userId,
    ownerGuestId: card.guestId,
    date: formatLocalDateKey(new Date(card.createdAt)),
    quoteText: card.quote,
    author: card.authorDisplayName,
    personaId: null,
    photoBackgroundUri: card.imageUrl || null,
    photoStoragePath: card.storagePath,
    photoOrientation: "portrait",
    styleFontId: card.styleFontId,
    styleColorSchemeId: card.styleColorSchemeId,
    createdAt: card.createdAt,
    visibility: card.visibility,
    isFavorite: card.isFavorite,
  };
}

export async function updateUserPhotoFavorite(
  photoId: string,
  isFavorite: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("user_photos")
    .update({ is_favorite: isFavorite })
    .eq("id", photoId);
  if (error) {
    console.error("Failed to update photo favorite", { error, photoId });
    return false;
  }
  return true;
}

export async function updateUserPhotoVisibility(
  photoId: string,
  visibility: QuoteVisibility,
): Promise<boolean> {
  const { error } = await supabase
    .from("user_photos")
    .update({ visibility })
    .eq("id", photoId);
  if (error) {
    console.error("Failed to update photo visibility", { error, photoId });
    return false;
  }
  return true;
}
