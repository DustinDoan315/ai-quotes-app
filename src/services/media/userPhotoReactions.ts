import { supabase } from "@/config/supabase";

export type UserPhotoReactionType = "love" | "clap" | "fire";

type SendUserPhotoReactionParams = {
  photoId: string;
  userId: string | null;
  guestId: string | null;
  type: UserPhotoReactionType;
  comment?: string | null;
};

export const sendUserPhotoReaction = async (
  params: SendUserPhotoReactionParams,
): Promise<boolean> => {
  const { photoId, userId, guestId, type, comment } = params;

  if (!photoId) {
    return false;
  }

  const { error } = await supabase
    .from("user_photo_reactions")
    .upsert(
      {
        photo_id: photoId,
        reactor_user_id: userId,
        reactor_guest_id: guestId,
        type,
        comment: comment ?? null,
      },
      {
        onConflict: "photo_id,reactor_user_id,reactor_guest_id,type",
      },
    );

  if (error) {
    console.error("Failed to send photo reaction", { error });
    return false;
  }

  return true;
};

