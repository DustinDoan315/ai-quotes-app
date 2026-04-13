import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

type SaveUserAvatarParams = {
  localUri: string;
  userId: string;
};

type SaveUserAvatarResult = {
  publicUrl: string;
  storagePath: string;
};

export async function saveUserAvatar(
  params: SaveUserAvatarParams,
): Promise<SaveUserAvatarResult | null> {
  const { localUri, userId } = params;
  if (!localUri) return null;

  const fileName = `avatar-${Date.now()}.jpg`;
  const storagePath = `${userId}/${fileName}`;

  let uploadUri = localUri;

  try {
    const context = ImageManipulator.manipulate(localUri).resize({ width: 512 });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.7,
    });
    uploadUri = saved.uri;
  } catch {
    // Proceed with original URI if manipulation fails
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/user-avatars/${encodeURIComponent(
    storagePath,
  )}`;

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
    return null;
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-avatars/${encodeURIComponent(
    storagePath,
  )}`;

  if (!publicUrl) {
    return null;
  }

  return {
    publicUrl,
    storagePath,
  };
}
