import { useEffect, useRef, useState } from 'react';
export function createHomeActiveShareRegistry(onBusy: (busy: boolean) => void = () => { }, onChange: () => void = () => { }) {
  let registration: {
    id: string;
    action: () => Promise<void>;
    token: symbol;
  } | null = null;
  let busy = false;
  return {
    register(id: string, action: () => Promise<void>) {
      const token = Symbol(id);
      registration = { id, action, token };
      onChange();
      return () => { if (registration?.token === token) {
        registration = null;
        onChange();
      } };
    },
    canShare(id: string) { return !busy && registration?.id === id; },
    get isSharing() { return busy; },
    async share(id: string): Promise<void> {
      if (busy || registration?.id !== id)
        return;
      const action = registration.action;
      busy = true;
      onBusy(true);
      try {
        await action();
      }
      finally {
        busy = false;
        onBusy(false);
      }
    },
  };
}
export function useHomeActiveShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [, setVersion] = useState(0);
  const mounted = useRef(true);
  const registry = useRef<ReturnType<typeof createHomeActiveShareRegistry> | null>(null);
  if (!registry.current)
    registry.current = createHomeActiveShareRegistry((busy) => { if (mounted.current)
      setIsSharing(busy); }, () => { if (mounted.current)
      setVersion((version) => version + 1); });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return { register: registry.current.register, share: registry.current.share, canShare: registry.current.canShare, isSharing };
}
