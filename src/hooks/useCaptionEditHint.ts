import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const CAPTION_EDIT_HINT_KEY = 'inkly.caption-edit-hint-seen.v2';

/** Keep contextual guidance visible until the first caption touch, then remember discovery. */
export function useCaptionEditHint(eligible: boolean, identity: string | null) {
  const [visibleFor, setVisibleFor] = useState<string | null>(null);
  const mounted = useRef(false);
  const request = useRef(0);
  const current = useRef({ eligible, identity });
  current.current = { eligible, identity };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current += 1; };
  }, []);

  useEffect(() => {
    const operation = ++request.current;
    setVisibleFor(null);
    if (!eligible || !identity) return;
    void AsyncStorage.getItem(CAPTION_EDIT_HINT_KEY).then(seen => {
      if (seen || !mounted.current || operation !== request.current ||
          !current.current.eligible || current.current.identity !== identity) return;
      setVisibleFor(identity);
    }).catch(() => {});
    return () => { request.current += 1; };
  }, [eligible, identity]);

  const dismissControls = useCallback(() => {
    request.current += 1;
    if (mounted.current) setVisibleFor(null);
    if (current.current.eligible && current.current.identity) {
      void AsyncStorage.setItem(CAPTION_EDIT_HINT_KEY, '1').catch(() => {});
    }
  }, []);

  const showHint = useCallback(() => {
    if (!current.current.eligible || !current.current.identity) return;
    request.current += 1;
    if (mounted.current) setVisibleFor(current.current.identity);
  }, []);

  return {
    controlsVisible: eligible && Boolean(identity) && visibleFor === identity,
    activateControls: dismissControls,
    dismissControls,
    showHint,
  };
}
