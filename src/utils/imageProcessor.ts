import * as ImageManipulator from 'expo-image-manipulator';
import { GPT_CONFIG } from '@/services/ai/config';


const TARGET_MAX_DIMENSION = 512;
const TARGET_QUALITY = 0.7;

export const downscaleImageForGPT = async (
  imageUri: string,
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: TARGET_MAX_DIMENSION,
          },
        },
      ],
      {
        compress: TARGET_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    if (!manipResult.base64) {
      throw new Error("Failed to generate base64 image");
    }

    return `data:image/jpeg;base64,${manipResult.base64}`;
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
