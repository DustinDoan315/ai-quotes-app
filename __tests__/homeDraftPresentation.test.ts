import { getHomeDraftPresentation } from '@/domain/home/homeDraftPresentation';
const draft = { hasPhoto: true, isOnFeed: false, hasSavedPhoto: false, isSaving: false, isSharing: false };
it('focuses the draft and protects unsaved exit without the camera dock', () => {
  expect(getHomeDraftPresentation(draft)).toEqual({ focused: true, canExit: true, confirmExit: true, showDock: false });
});
it('allows cancellation during generation, but protects saving and sharing', () => {
  expect(getHomeDraftPresentation(draft).canExit).toBe(true);
  expect(getHomeDraftPresentation({ ...draft, isSaving: true }).canExit).toBe(false);
  expect(getHomeDraftPresentation({ ...draft, isSharing: true }).canExit).toBe(false);
});
it('returns to the camera without discarding an already saved photo', () => {
  expect(getHomeDraftPresentation({ ...draft, hasSavedPhoto: true }).confirmExit).toBe(false);
});
it.each([{ hasPhoto: false, isOnFeed: false }, { hasPhoto: true, isOnFeed: true }])('preserves the camera/feed dock %#', state => {
  expect(getHomeDraftPresentation({ ...draft, ...state })).toMatchObject({ focused: false, canExit: false, showDock: true });
});
