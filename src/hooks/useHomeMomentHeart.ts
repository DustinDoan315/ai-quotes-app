import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/appState/uiStore';
import { updateUserPhotoFavorite, type QuotePhotoCard } from '@/services/media/userPhotosApi';
import { sendUserPhotoReaction } from '@/services/media/userPhotoReactions';
export type HomeHeartMode = 'favorite' | 'reaction' | 'signin' | 'hidden';
export type HomeMomentHeartOptions = {
  card: QuotePhotoCard | null;
  authUserId: string | null;
  signedInUserId: string | null;
  identityEpoch: number;
  patchFavorite: (photoId: string, value: boolean) => void;
  onSignIn: () => void;
  onReactionSuccess?: (photoId: string) => void;
  onFavoritePending?: (photoId: string, value: boolean | null) => void;
};
export function getHomeMomentHeartMode(card: QuotePhotoCard | null, authUserId: string | null, signedInUserId: string | null): HomeHeartMode {
  if (!card)
    return 'hidden';
  if (authUserId && card.userId === authUserId)
    return 'favorite';
  if (card.userId && card.visibility === 'private')
    return 'hidden';
  if (!signedInUserId)
    return 'signin';
  if (card.userId && card.userId !== signedInUserId && card.visibility !== 'private')
    return 'reaction';
  return 'hidden';
}
export function useHomeMomentHeart(options: HomeMomentHeartOptions) {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const current = useRef(options);
  current.current = options;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const mode = getHomeMomentHeartMode(options.card, options.authUserId, options.signedInUserId);
  async function press(): Promise<void> {
    const input = current.current;
    const card = input.card;
    const action = getHomeMomentHeartMode(card, input.authUserId, input.signedInUserId);
    if (action === 'signin') {
      input.onSignIn();
      return;
    }
    if (!card || action === 'hidden' || pending.current)
      return;
    pending.current = true;
    setIsBusy(true);
    const value = !card.isFavorite;
    const sameIdentity = () => mounted.current && current.current.identityEpoch === input.identityEpoch && current.current.authUserId === input.authUserId && current.current.signedInUserId === input.signedInUserId;
    if (action === 'favorite') {
      input.onFavoritePending?.(card.id, value);
      input.patchFavorite(card.id, value);
    }
    let success = false;
    try {
      success = action === 'favorite' ? await updateUserPhotoFavorite(card.id, value) : await sendUserPhotoReaction({ photoId: card.id, userId: input.signedInUserId, type: 'love' });
      if (sameIdentity()) {
        if (action === 'favorite')
          input.patchFavorite(card.id, success ? value : card.isFavorite);
        else if (success)
          input.onReactionSuccess?.(card.id);
        if (!success)
          useUIStore.getState().showToast(t(action === 'favorite' ? 'memories.favoriteSaveError' : 'home.ambient.reactionError'), 'error');
      }
    }
    catch {
      if (sameIdentity()) {
        if (action === 'favorite')
          input.patchFavorite(card.id, card.isFavorite);
        useUIStore.getState().showToast(t(action === 'favorite' ? 'memories.favoriteSaveError' : 'home.ambient.reactionError'), 'error');
      }
    }
    finally {
      // Clear only the captured operation; late account completions must not touch new caches.
      if (sameIdentity() && action === 'favorite')
        input.onFavoritePending?.(card.id, null);
      pending.current = false;
      if (mounted.current)
        setIsBusy(false);
    }
  }
  return { mode, isFavorite: mode === 'favorite' && Boolean(options.card?.isFavorite), isBusy, press };
}
