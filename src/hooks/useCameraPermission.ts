import { useCameraPermissions } from "expo-camera";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useCameraPermission() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const isSimulator = !Device.isDevice;
  const isLoading = !isSimulator && permission === null;
  const isGranted = !isSimulator && (permission?.granted ?? false);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (isSimulator) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState !== "active" && nextState === "active") {
        void getPermission().catch((error: unknown) => {
          console.error("Failed to refresh camera permission", error);
        });
      }
    });

    return () => subscription.remove();
  }, [getPermission, isSimulator]);

  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
