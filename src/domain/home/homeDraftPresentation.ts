export function getHomeDraftPresentation(input: {
  hasPhoto: boolean;
  isOnFeed: boolean;
  hasSavedPhoto: boolean;
  isSaving: boolean;
  isSharing: boolean;
}) {
  const focused = input.hasPhoto && !input.isOnFeed;
  return {
    focused,
    canExit: focused && !input.isSaving && !input.isSharing,
    confirmExit: focused && !input.hasSavedPhoto,
    showDock: !focused,
  };
}
