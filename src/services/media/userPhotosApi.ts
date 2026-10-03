import { z } from "zod";
import { supabase } from "@/config/supabase";
import { parseHomeVibeKey } from "@/domain/home/homeVibeKey";
import type { HomeVibeKey } from "@/types/homeBackground";
import type { QuoteMemory, QuoteVisibility } from "@/types/memory";
import { formatLocalDateKey } from "@/utils/dateKey";
import { parseQuotePosition, type QuotePosition } from "@/features/quotes/quotePosition";

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
  photo_orientation: z.enum(["portrait", "landscape"]).nullable().optional(),
  quote_position_x: z.number().nullable().optional(),
  quote_position_y: z.number().nullable().optional(),
  quote_scale: z.number().nullable().optional(),
  quote_rotation: z.number().nullable().optional(),
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
  photoOrientation: "portrait" | "landscape";
  quotePosition: QuotePosition;
  visibility: QuoteVisibility;
  isFavorite: boolean;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;
export const SIGNED_URL_RETRY_INTERVAL_MS = 60_000;
export const SIGNED_URL_REFRESH_INTERVAL_MS =
  (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000;

async function getSignedPhotoUrlMap(
  pathsToSign: string[],
): Promise<Map<string, string>> {
  const paths = [...new Set(pathsToSign)];
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from("user-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("Failed to create signed photo URLs", {
      error,
      photoCount: paths.length,
    });
    return new Map();
  }

  const signedPhotos = data.flatMap(({ path, signedUrl, error: pathError }) =>
    !pathError && path && signedUrl ? ([[path, signedUrl]] as const) : [],
  );
  if (signedPhotos.length < paths.length) {
    console.warn("Some photo URLs could not be signed", {
      requested: paths.length,
      signed: signedPhotos.length,
    });
  }
  return new Map(signedPhotos);
}

type ListQuotePhotoCardsParams = {
  guestId?: string | null;
  userId?: string | null;
  feedUserIds?: string[];
  limit?: number;
  offset?: number;
  signPhotoUrls?: boolean;
};

const QUOTE_PHOTO_COLUMNS =
  "id, image_url, storage_path, created_at, quote, user_id, guest_id, style_font_id, style_color_scheme_id, home_vibe_key, photo_stack_id, photo_orientation, quote_position_x, quote_position_y, quote_scale, quote_rotation, visibility, is_favorite";

export const listQuotePhotoCards = async (
  params: ListQuotePhotoCardsParams,
): Promise<QuotePhotoCard[]> => {
  if (params.feedUserIds && params.feedUserIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("user_photos")
    .select(QUOTE_PHOTO_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (params.feedUserIds && params.feedUserIds.length > 0) {
    query = query.in("user_id", params.feedUserIds);
  } else if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else if (params.guestId) {
    query = query.eq("guest_id", params.guestId);
  }

  if (params.limit && params.offset != null) {
    query = query.range(params.offset, params.offset + params.limit - 1);
  } else if (params.limit) {
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

  const signedPhotoUrls = params.signPhotoUrls === false
    ? new Map<string, string>()
    : await getSignedPhotoUrlMap(parsed.data.map((row) => row.storage_path));

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
      homeVibeKey: parseHomeVibeKey(row.home_vibe_key),
      photoStackId: row.photo_stack_id ?? null,
      photoOrientation: row.photo_orientation ?? "portrait",
      quotePosition: parseQuotePosition(row.quote_position_x, row.quote_position_y, row.quote_scale, row.quote_rotation),
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

function getLocalDayRange(dateKey: string): { startIso: string; endIso: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const [, year, month, day] = match;
  const start = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    start.getFullYear() !== Number(year) ||
    start.getMonth() !== Number(month) - 1 ||
    start.getDate() !== Number(day)
  ) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export const listQuotePhotoCardsForDay = async (
  params: ListQuotePhotoCardsForDayParams,
): Promise<QuotePhotoCard[]> => {
  const { dateKey, feedUserIds, guestId, limit } = params;
  if (feedUserIds && feedUserIds.length === 0) {
    return [];
  }

  const { startIso, endIso } = getLocalDayRange(dateKey);

  let query = supabase
    .from("user_photos")
    .select(QUOTE_PHOTO_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
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

  const signedPhotoUrls = await getSignedPhotoUrlMap(
    parsed.data.map((row) => row.storage_path),
  );

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
      homeVibeKey: parseHomeVibeKey(row.home_vibe_key),
      photoStackId: row.photo_stack_id ?? null,
      photoOrientation: row.photo_orientation ?? "portrait",
      quotePosition: parseQuotePosition(row.quote_position_x, row.quote_position_y, row.quote_scale, row.quote_rotation),
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
    photoOrientation: card.photoOrientation,
    quotePosition: card.quotePosition,
    styleFontId: card.styleFontId,
    styleColorSchemeId: card.styleColorSchemeId,
    createdAt: card.createdAt,
    visibility: card.visibility,
    isFavorite: card.isFavorite,
  };
}

export async function refreshQuotePhotoCardUrls(
  cards: QuotePhotoCard[],
): Promise<{ cards: QuotePhotoCard[]; complete: boolean }> {
  if (cards.length === 0) {
    return { cards, complete: true };
  }
  const paths = [...new Set(cards.map((card) => card.storagePath))];
  const signedUrls = await getSignedPhotoUrlMap(paths);
  return {
    cards: cards.map((card) => ({
      ...card,
      imageUrl: signedUrls.get(card.storagePath) ?? card.imageUrl,
    })),
    complete: signedUrls.size === paths.length,
  };
}

export async function updateUserPhotoFavorite(
  photoId: string,
  isFavorite: boolean,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_photos")
    .update({ is_favorite: isFavorite })
    .eq("id", photoId)
    .select("id,is_favorite");
  if (error) {
    console.error("Failed to update photo favorite", { error, photoId });
    return false;
  }
  return data?.length === 1 && data[0].id === photoId && data[0].is_favorite === isFavorite;
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
