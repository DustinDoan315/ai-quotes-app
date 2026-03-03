import { z } from "zod";

const quotePhotoSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  quote: z.string().max(180),
  createdAt: z.string(),
});

const listResponseSchema = z.object({
  items: z.array(quotePhotoSchema),
});

export type QuotePhotoCard = z.infer<typeof quotePhotoSchema>;

type ListQuotePhotoCardsParams = {
  guestId?: string | null;
  userId?: string | null;
  limit?: number;
};

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const listQuotePhotoCards = async (
  params: ListQuotePhotoCardsParams,
): Promise<QuotePhotoCard[]> => {
  const config = getSupabaseConfig();

  if (!config) {
    return [];
  }

  const { supabaseUrl, supabaseAnonKey } = config;

  const url = new URL(`${supabaseUrl}/functions/v1/user-photos`);

  if (params.guestId) {
    url.searchParams.set("guestId", params.guestId);
  }

  if (params.userId) {
    url.searchParams.set("userId", params.userId);
  }

  if (params.limit) {
    url.searchParams.set("limit", String(params.limit));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const parsed = listResponseSchema.safeParse(data);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.items;
};

