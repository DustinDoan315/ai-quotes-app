import { useCallback, useRef, useState } from "react";
import { Platform, Share, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useQuoteMomentShare() {
  const captureRefView = useRef<View>(null);
  const [watermarkForExport, setWatermarkForExport] = useState(false);

  const shareMoment = useCallback(async () => {
    const target = captureRefView.current;
    if (!target) {
      return;
    }
    setWatermarkForExport(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    try {
      const uri = await captureRef(target, {
        format: "png",
        quality: 1,
      });
      if (Platform.OS === "web") {
        await Share.share({
          title: "Moment",
          url: uri,
        });
        return;
      }
      await Share.share({ url: uri });
    } catch {
    } finally {
      setWatermarkForExport(false);
    }
  }, []);

  return {
    captureRefView,
    watermarkForExport,
    shareMoment,
  };
}
