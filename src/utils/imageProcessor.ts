import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const UPLOAD_MAX_DIMENSION = 1024;
const UPLOAD_QUALITY = 0.6;
const MAX_AI_BASE64_LENGTH = 1_800_000;

const COMPRESSION_ATTEMPTS = [
  { maxDimension: UPLOAD_MAX_DIMENSION, quality: UPLOAD_QUALITY },
  { maxDimension: 896, quality: 0.5 },
  { maxDimension: 768, quality: 0.45 },
  { maxDimension: 640, quality: 0.4 },
] as const;

export const compressImageForUpload = async (
  imageUri: string,
): Promise<string> => {
  try {
    let lastBase64: string | null = null;

    for (const attempt of COMPRESSION_ATTEMPTS) {
      const context = ImageManipulator.manipulate(imageUri).resize({
        width: attempt.maxDimension,
      });
      const renderedImage = await context.renderAsync();
      const result = await renderedImage.saveAsync({
        compress: attempt.quality,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!result.base64) {
        continue;
      }

      lastBase64 = result.base64;
      if (result.base64.length <= MAX_AI_BASE64_LENGTH) {
        return result.base64;
      }
    }

    if (lastBase64) {
      throw new Error("Image is too large to process");
    }

    throw new Error("Failed to generate base64 image");
  } catch (error) {
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
