import { supabase } from "@/config/supabase";

export type UserPhotoMessage = {
  id: string;
  photo_id: string;
  sender_user_id: string | null;
  sender_guest_id: string | null;
  body: string;
  created_at: string;
};

type SendUserPhotoMessageParams = {
  photoId: string;
  userId: string | null;
  guestId: string | null;
  body: string;
};

export const sendUserPhotoMessage = async (
  params: SendUserPhotoMessageParams,
): Promise<UserPhotoMessage | null> => {
  const { photoId, userId, guestId, body } = params;

  if (!photoId) {
    return null;
  }

  if (!body.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_photo_messages")
    .insert({
      photo_id: photoId,
      sender_user_id: userId,
      sender_guest_id: guestId,
      body,
    })
    .select()
    .single<UserPhotoMessage>();

  if (error) {
    console.error("Failed to send photo message", { error });
    return null;
  }

  return data;
};

type ListPhotoMessagesForPhotoParams = {
  photoId: string;
  limit?: number;
};

export const listPhotoMessagesForPhoto = async (
  params: ListPhotoMessagesForPhotoParams,
): Promise<UserPhotoMessage[]> => {
  const { photoId, limit = 100 } = params;

  if (!photoId) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_photo_messages")
    .select("*")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error("Failed to list photo messages", { error });
    return [];
  }

  return data as UserPhotoMessage[];
};

