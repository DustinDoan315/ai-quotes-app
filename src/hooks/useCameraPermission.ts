import { useCameraPermissions } from "expo-camera";
import * as Device from "expo-device";

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const isSimulator = !Device.isDevice;
  const isLoading = !isSimulator && permission === null;
  const isGranted = !isSimulator && (permission?.granted ?? false);

  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
