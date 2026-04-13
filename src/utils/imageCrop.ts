import { Image } from "react-native";

export function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export function centerCropToAspect(
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
