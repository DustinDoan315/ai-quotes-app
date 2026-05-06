import { useCameraPermissions } from "expo-camera";
import { useEffect } from "react";

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const isLoading = permission === null;
  const isGranted = permission?.granted ?? false;

  useEffect(() => {
    if (!isLoading && !isGranted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [isLoading, isGranted, permission?.canAskAgain]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
