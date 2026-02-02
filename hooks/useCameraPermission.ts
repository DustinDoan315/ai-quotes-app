import { useCameraPermissions } from "expo-camera";

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const isLoading = permission === null;
  const isGranted = permission?.granted ?? false;
  return {
    isLoading,
    isGranted,
    requestPermission,
  };
}
