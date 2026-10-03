import { parseCustomReactionEmoji } from "@/domain/reactions/customEmoji";
import { supabase } from "@/config/supabase";

export type QuickPhotoReactionType =
  | "love"
  | "clap"
  | "fire"
  | "pleading"
  | "sparkles"
  | "heart_hands"
  | "laugh"
  | "party"
  | "white_heart";

export type UserPhotoReactionType = QuickPhotoReactionType | `emoji:${string}`;

export const PHOTO_REACTION_EMOJIS: Record<QuickPhotoReactionType, string> = {
  love: "❤️",
  clap: "👏",
  fire: "🔥",
  pleading: "🥺",
  sparkles: "✨",
  heart_hands: "🫶",
  laugh: "😂",
  party: "🎉",
  white_heart: "🤍",
};

export function getPhotoReactionEmoji(type: UserPhotoReactionType): string | null {
  return PHOTO_REACTION_EMOJIS[type as QuickPhotoReactionType] ?? parseCustomReactionEmoji(type);
}

type SendUserPhotoReactionParams = {
  photoId: string;
  userId: string | null;
  type: UserPhotoReactionType;
};

export const sendUserPhotoReaction = async (
  params: SendUserPhotoReactionParams,
): Promise<boolean> => {
  const { photoId, userId, type } = params;

  if (!photoId || !userId || !getPhotoReactionEmoji(type)) {
    return false;
  }

  let error;
  try {
    ({ error } = await supabase
      .from("user_photo_reactions")
      .upsert(
        {
          photo_id: photoId,
          reactor_user_id: userId,
          reactor_guest_id: null,
          type,
        },
        {
          onConflict: "photo_id,reactor_user_id,reactor_guest_id,type",
          ignoreDuplicates: true,
        },
      ));
  } catch (caughtError) {
    console.error("Failed to send photo reaction", caughtError);
    return false;
  }

  if (error) {
    console.error("Failed to send photo reaction", { error });
    return false;
  }

  return true;
};
