# Task 2 Report: Home image picker permission gate

Status: complete.

Removed the Home gallery action's `requestMediaLibraryPermissionsAsync` preflight and its unused `expo-image-picker` import. The existing helper still launches the images-only system picker and returns `null` on cancellation. The cancellation early return, selected-image generation path, and camera permission flow are unchanged. Profile avatar picking was not changed.

Verification: source-reviewed the Home handler and picker helper; `git diff --check` passed. Tests were not run, as requested. Fresh-install behavior was not verified on physical iOS or Android devices.

Concern: confirm direct picker launch and cancellation on fresh iOS and Android installs during device QA.
