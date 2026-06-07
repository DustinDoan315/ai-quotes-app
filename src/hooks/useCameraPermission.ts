import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const isLoading = permission === null;
  const isGranted = permission?.granted ?? false;
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!isLoading && !isGranted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [isLoading, isGranted, permission?.canAskAgain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check when the app returns to foreground so the camera activates
  // immediately after the user grants permission (OS dialog or Settings),
  // without requiring an app restart.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev !== "active" && next === "active") {
        requestPermission();
      }
    });
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
