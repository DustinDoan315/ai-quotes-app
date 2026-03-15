import * as ImagePicker from "expo-image-picker";

export async function pickPhotoForQuote() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    base64: asset.base64 ?? "",
    width: asset.width,
    height: asset.height,
  };
}
