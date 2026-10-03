import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const CAPTION_EDIT_HINT_KEY = 'inkly.caption-edit-hint-seen.v1';
const FIRST_HINT_DURATION_MS = 4000;
const MANUAL_CONTROLS_DURATION_MS = 8000;

/** Persist discovery once, then reveal quote controls only during direct interaction. */
export function useCaptionEditHint(eligible: boolean, identity: string | null) {
  const [visible, setVisible] = useState(false);
  const mounted = useRef(false);
  const visibleFor = useRef<string | null>(null);
  const request = useRef(0);
  const interacted = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef({ eligible, identity });
  current.current = { eligible, identity };

  const clearTimer = useCallback(() => {
    if (timeout.current !== null) clearTimeout(timeout.current);
    timeout.current = null;
  }, []);
  const showFor = useCallback((duration: number) => {
    clearTimer();
    visibleFor.current = current.current.identity;
    setVisible(true);
    timeout.current = setTimeout(() => {
      timeout.current = null;
      if (mounted.current) setVisible(false);
    }, duration);
  }, [clearTimer]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
      clearTimer();
    };
  }, [clearTimer]);

  useEffect(() => {
    const operation = ++request.current;
    clearTimer();
    setVisible(false);
    interacted.current = false;
    if (!eligible || !identity) return;

    void AsyncStorage.getItem(CAPTION_EDIT_HINT_KEY).then(seen => {
      if (
        seen || !mounted.current || operation !== request.current ||
        interacted.current || !current.current.eligible || current.current.identity !== identity
      ) return;
      showFor(FIRST_HINT_DURATION_MS);
      void AsyncStorage.setItem(CAPTION_EDIT_HINT_KEY, '1').catch(() => {});
    }).catch(() => {});
    return () => {
      request.current += 1;
      clearTimer();
    };
  }, [eligible, identity, clearTimer, showFor]);

  const activateControls = useCallback(() => {
    if (!current.current.eligible || !current.current.identity) return;
    interacted.current = true;
    request.current += 1;
    showFor(MANUAL_CONTROLS_DURATION_MS);
    void AsyncStorage.setItem(CAPTION_EDIT_HINT_KEY, '1').catch(() => {});
  }, [showFor]);

  const dismissControls = useCallback(() => {
    interacted.current = true;
    request.current += 1;
    clearTimer();
    if (mounted.current) setVisible(false);
  }, [clearTimer]);

  return { controlsVisible: eligible && Boolean(identity) && visibleFor.current === identity && visible, activateControls, dismissControls };
}
