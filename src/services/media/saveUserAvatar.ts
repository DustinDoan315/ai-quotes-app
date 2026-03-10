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
  console.log("saveUserAvatar:start", { userId, hasLocalUri: Boolean(localUri) });
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
    console.log("saveUserAvatar:manipulated", {
      originalUri: localUri,
      uploadUri,
      storagePath,
    });
  } catch (error) {
    console.log("saveUserAvatar:manipulate_failed", {
      error,
      localUri,
      storagePath,
    });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("saveUserAvatar:missing_supabase_config");
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
    console.log("saveUserAvatar:upload_failed", {
      status: uploadResponse.status,
      storagePath,
    });
    return null;
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-avatars/${encodeURIComponent(
    storagePath,
  )}`;

  if (!publicUrl) {
    console.log("saveUserAvatar:no_public_url", { storagePath });
    return null;
  }

  console.log("saveUserAvatar:success", {
    storagePath,
    publicUrl,
  });

  return {
    publicUrl,
    storagePath,
  };
}
