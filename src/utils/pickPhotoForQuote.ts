import * as ImagePicker from "expo-image-picker";

export async function pickPhotoForQuote() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}
