import {
  QUOTE_OUTPUT_SIZE,
  type QuoteOrientation,
} from "@/constants/quoteImageSize";
import { supabase } from "@/config/supabase";
import { signInAnonymously } from "@/services/supabase-auth";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";

type SaveUserPhotoParams = {
  localUri: string;
  userId: string | null;
  guestId: string | null;
  quote?: string | null;
  orientation?: QuoteOrientation;
  styleFontId?: "small" | "medium" | "large";
  styleColorSchemeId?: "light" | "amber" | "pink";
  homeVibeKey?: string | null;
};

type SaveUserPhotoResult = {
  storagePath: string;
  publicUrl: string;
  orientation: QuoteOrientation;
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

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

function centerCropToAspect(
  srcWidth: number,
  srcHeight: number,
  targetAspect: number,
): { originX: number; originY: number; width: number; height: number } {
  const srcAspect = srcWidth / srcHeight;
  if (srcAspect > targetAspect) {
    const width = Math.round(srcHeight * targetAspect);
    const originX = Math.round((srcWidth - width) / 2);
    return { originX, originY: 0, width, height: srcHeight };
  }
  const height = Math.round(srcWidth / targetAspect);
  const originY = Math.round((srcHeight - height) / 2);
  return { originX: 0, originY, width: srcWidth, height };
}

export const saveUserPhoto = async (
  params: SaveUserPhotoParams,
): Promise<SaveUserPhotoResult | null> => {
  const {
    localUri,
    userId,
    guestId,
    quote,
    orientation = "portrait",
    styleFontId = "medium",
    styleColorSchemeId = "light",
    homeVibeKey = null,
  } = params;

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

  const output = QUOTE_OUTPUT_SIZE[orientation];
  const targetAspect = output.width / output.height;

  let uploadUri = localUri;
  try {
    const { width: srcW, height: srcH } = await getImageDimensions(localUri);
    const cropRect = centerCropToAspect(srcW, srcH, targetAspect);
    const context = ImageManipulator.manipulate(localUri);
    context.crop(cropRect);
    context.resize({ width: output.width, height: output.height });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: 0.75,
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
    style_font_id: styleFontId,
    style_color_scheme_id: styleColorSchemeId,
    home_vibe_key: homeVibeKey,
  });

  if (insertError) {
    console.error("Failed to insert user_photos row", insertError);
    return null;
  }

  return {
    storagePath: path,
    publicUrl,
    orientation,
  };
};
