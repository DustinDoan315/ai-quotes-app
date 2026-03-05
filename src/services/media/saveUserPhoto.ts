import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "../../../config/supabase";

type SaveUserPhotoParams = {
  localUri: string;
  userId: string | null;
  guestId: string | null;
  quote?: string | null;
};

type SaveUserPhotoResult = {
  storagePath: string;
  publicUrl: string;
};

const createOwnerFolder = (userId: string | null, guestId: string | null) => {
  if (userId) {
    return userId;
  }
  if (guestId) {
    return guestId;
  }
  return `anonymous-${Date.now().toString(36)}`;
};

export const saveUserPhoto = async (
  params: SaveUserPhotoParams,
): Promise<SaveUserPhotoResult | null> => {
  const { localUri, userId, guestId, quote } = params;

  if (!localUri) {
    return null;
  }

  let uploadUri = localUri;
  try {
    const manipulated = await manipulateAsync(
      localUri,
      [
        {
          resize: {
            width: 720,
          },
        },
      ],
      {
        compress: 0.6,
        format: SaveFormat.JPEG,
      },
    );
    uploadUri = manipulated.uri;
  } catch (error) {
    console.error("Failed to preprocess image for upload", error);
  }

  const ownerFolder = createOwnerFolder(userId, guestId);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${ownerFolder}/${fileName}`;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration for media upload");
    return null;
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/user-photos/${encodeURIComponent(path)}`;

  const formData = new FormData();
  formData.append("file", {
    uri: uploadUri,
    name: fileName,
    type: "image/jpeg",
  } as unknown as Blob);

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    console.error(
      "Failed to upload image to Supabase storage via REST",
      uploadResponse.status,
    );
    return null;
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-photos/${encodeURIComponent(path)}`;

  const { error: insertError } = await supabase.from("user_photos").insert({
    user_id: userId,
    guest_id: guestId,
    image_url: publicUrl,
    storage_path: path,
    quote: quote ?? null,
  });

  if (insertError) {
    console.error("Failed to insert user_photos row", insertError);
  }

  return {
    storagePath: path,
    publicUrl,
  };
};
