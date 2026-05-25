import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const UPLOAD_MAX_DIMENSION = 1024;
const UPLOAD_QUALITY = 0.6;

export const compressImageForUpload = async (
  imageUri: string,
): Promise<string> => {
  try {
    const context = ImageManipulator.manipulate(imageUri).resize({
      width: UPLOAD_MAX_DIMENSION,
    });
    const renderedImage = await context.renderAsync();
    const result = await renderedImage.saveAsync({
      compress: UPLOAD_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    });

    if (!result.base64) {
      throw new Error("Failed to generate base64 image");
    }

    return result.base64;
  } catch (error) {
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
