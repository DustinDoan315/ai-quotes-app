import { createHomeAmbientTransition, beginHomeAmbientTransition, completeHomeAmbientTransition } from '@/theme/homeAmbient';
import { HOME_BACKGROUNDS } from '@/theme/homeBackgrounds';

describe('Home atmosphere transitions', () => {
  it('bounds rapid changes to two layers and rejects stale completions', () => {
    const initial = createHomeAmbientTransition(HOME_BACKGROUNDS[0]);
    const first = beginHomeAmbientTransition(initial, HOME_BACKGROUNDS[1], false);
    const next = beginHomeAmbientTransition(first, HOME_BACKGROUNDS[6], false);
    expect(next.previous?.vibeKey).toBe('mist');
    expect(next.current.vibeKey).toBe('sage');
    expect(completeHomeAmbientTransition(next, first.revision)).toBe(next);
    expect(completeHomeAmbientTransition(next, next.revision).previous).toBeNull();
  });
  it('reduced motion cancels the pending layer immediately', () => {
    const initial = createHomeAmbientTransition(HOME_BACKGROUNDS[0]);
    const first = beginHomeAmbientTransition(initial, HOME_BACKGROUNDS[1], false);
    const instant = beginHomeAmbientTransition(first, HOME_BACKGROUNDS[1], true);
    expect(instant.previous).toBeNull();
    expect(completeHomeAmbientTransition(instant, first.revision)).toBe(instant);
  });
});
