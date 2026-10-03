import { HOME_BACKGROUNDS } from '@/theme/homeBackgrounds';
import type { HomeVibeKey } from '@/types/homeBackground';
export function parseHomeVibeKey(raw: string | null | undefined): HomeVibeKey | null {
  return HOME_BACKGROUNDS.find((palette) => palette.vibeKey === raw)?.vibeKey ?? null;
}
