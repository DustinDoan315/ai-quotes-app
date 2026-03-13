import { z } from "zod";
import { supabase } from "@/config/supabase";

const quotePhotoRowSchema = z.object({
  id: z.string(),
  image_url: z.string().url(),
  created_at: z.string(),
  quote: z.string().max(180).nullable().optional(),
  user_id: z.string().nullable().optional(),
  guest_id: z.string().nullable().optional(),
  style_font_id: z.string().nullable().optional(),
  style_color_scheme_id: z.string().nullable().optional(),
});

export type QuotePhotoCard = {
  id: string;
  imageUrl: string;
  quote: string;
  createdAt: string;
  userId: string | null;
  guestId: string | null;
  styleFontId: "small" | "medium" | "large";
  styleColorSchemeId: "light" | "amber" | "pink";
};

type ListQuotePhotoCardsParams = {
  guestId?: string | null;
  userId?: string | null;
  limit?: number;
};

export const listQuotePhotoCards = async (
  params: ListQuotePhotoCardsParams,
): Promise<QuotePhotoCard[]> => {
  let query = supabase
    .from("user_photos")
    .select(
      "id, image_url, created_at, quote, user_id, guest_id, style_font_id, style_color_scheme_id",
    )
    .order("created_at", { ascending: false });

  if (params.userId) {
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

  return parsed.data.map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    quote: row.quote ?? "",
    userId: row.user_id ?? null,
    guestId: row.guest_id ?? null,
    styleFontId: (row.style_font_id as "small" | "medium" | "large") ?? "medium",
    styleColorSchemeId:
      (row.style_color_scheme_id as "light" | "amber" | "pink") ?? "light",
  }));
};

