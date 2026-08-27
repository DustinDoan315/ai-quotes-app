import { useCameraPermissions } from "expo-camera";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const isSimulator = !Device.isDevice;
  const isLoading = !isSimulator && permission === null;
  const isGranted = !isSimulator && (permission?.granted ?? false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (isSimulator) return;
    if (!isLoading && !isGranted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [isSimulator, isLoading, isGranted, permission?.canAskAgain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check when the app returns to foreground so the camera activates
  // immediately after the user grants permission (OS dialog or Settings),
  // without requiring an app restart.
  useEffect(() => {
    if (isSimulator) return;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev !== "active" && next === "active") {
        requestPermission();
      }
    });
    return () => sub.remove();
  }, [isSimulator]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
