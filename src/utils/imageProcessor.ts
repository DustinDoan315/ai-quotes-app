import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { GPT_CONFIG } from "@/services/ai/config";

const TARGET_MAX_DIMENSION = 256;
const TARGET_QUALITY = 0.4;

export const downscaleImageForGPT = async (
  imageUri: string,
): Promise<string> => {
  try {
    const context = ImageManipulator.manipulate(imageUri).resize({
      width: TARGET_MAX_DIMENSION,
    });
    const renderedImage = await context.renderAsync();
    const result = await renderedImage.saveAsync({
      compress: TARGET_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    });

    if (!result.base64) {
      throw new Error("Failed to generate base64 image");
    }

    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const estimateImageTokens = (base64Image: string): number => {
  const base64Length = base64Image.length;
  const imageSizeKB = (base64Length * 3) / 4 / 1024;

  if (imageSizeKB < 50) {
    return GPT_CONFIG.imageMaxTokens;
  }

  return Math.ceil((imageSizeKB / 50) * GPT_CONFIG.imageMaxTokens);
};
