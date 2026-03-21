import { z } from "zod";
import { supabase } from "@/config/supabase";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import type { HomeVibeKey } from "@/types/homeBackground";

const quotePhotoRowSchema = z.object({
  id: z.string(),
  image_url: z.string().url(),
  created_at: z.string(),
  quote: z.string().max(180).nullable().optional(),
  user_id: z.string().nullable().optional(),
  guest_id: z.string().nullable().optional(),
  style_font_id: z.string().nullable().optional(),
  style_color_scheme_id: z.string().nullable().optional(),
  home_vibe_key: z.string().nullable().optional(),
});

export type QuotePhotoCard = {
  id: string;
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
};

type ListQuotePhotoCardsParams = {
  guestId?: string | null;
  userId?: string | null;
  feedUserIds?: string[];
  limit?: number;
};

export const listQuotePhotoCards = async (
  params: ListQuotePhotoCardsParams,
): Promise<QuotePhotoCard[]> => {
  let query = supabase
    .from("user_photos")
    .select(
      "id, image_url, created_at, quote, user_id, guest_id, style_font_id, style_color_scheme_id, home_vibe_key",
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

  if (error || !data) {
    console.error("Failed to load quote photo feed", { error });
    return [];
  }

  const parsed = z.array(quotePhotoRowSchema).safeParse(data);

  if (!parsed.success) {
    console.error("Failed to parse quote photo feed rows", {
      issues: parsed.error.issues,
    });
    return [];
  }

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
      imageUrl: row.image_url,
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
    };
  });
};

