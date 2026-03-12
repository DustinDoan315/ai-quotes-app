import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/config/supabase";
import { signInAnonymously } from "@/services/supabase-auth";

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

  const sessionResult = await supabase.auth.getSession();
  if (!sessionResult.data.session) {
    const { error } = await signInAnonymously();
    if (error) {
      console.error("Failed to start anonymous session", error);
      return null;
    }
  }

  let uploadUri = localUri;
  try {
    const context = ImageManipulator.manipulate(localUri);
    context.resize({ width: 720 });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: 0.6,
      format: SaveFormat.JPEG,
    });
    uploadUri = saved.uri;
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
    quote: quote ?? "",
  });

  if (insertError) {
    console.error("Failed to insert user_photos row", insertError);
    return null;
  }

  return {
    storagePath: path,
    publicUrl,
  };
};
