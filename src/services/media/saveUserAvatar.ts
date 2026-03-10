import { supabase } from "@/config/supabase";

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

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const fileName = `avatar-${Date.now()}.jpg`;
  const storagePath = `${userId}/${fileName}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/user-avatars/${encodeURIComponent(storagePath)}`;

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: fileName,
    type: "image/jpeg",
  } as unknown as Blob);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? supabaseAnonKey;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) return null;

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-avatars/${encodeURIComponent(
    storagePath,
  )}`;
  return { publicUrl, storagePath };
}

