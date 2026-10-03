import type { HomeBackgroundPalette } from '@/types/homeBackground';

export const HOME_AMBIENT_LAYOUT = {
  horizontalGutter: 20, headerMinHeight: 56, dockMinHeight: 112,
  dockClearance: 12, actionRowMinHeight: 64, regionGap: 12,
  radius: 24, shutterSize: 72, hitArea: 48, crossfadeDuration: 300,
} as const;

export const HOME_AMBIENT_CHROME = {
  text: '#ffffff', muted: 'rgba(255,255,255,0.72)',
  surface: 'rgba(255,255,255,0.055)', border: 'rgba(255,255,255,0.14)',
  inactiveSegment: 'rgba(255,255,255,0.27)',
} as const;

function darken(hex: string, amount: number): string {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb || rgb.length !== 3) return '#080b18';
  return `#${rgb.map(v => Math.round(parseInt(v, 16) * amount).toString(16).padStart(2, '0')).join('')}`;
}

export function getHomeAmbientColors(palette: HomeBackgroundPalette) {
  return {
    base: darken(palette.colors[0] ?? '#0f172a', 0.35),
    primaryWash: palette.colors[1] ?? palette.colors[0],
    secondaryWash: palette.colors[palette.colors.length - 1],
    scrim: 'rgba(0,0,0,0.42)', edge: palette.colors[1] ?? '#64748b',
  };
}

export type HomeAmbientTransition = {
  current: HomeBackgroundPalette; previous: HomeBackgroundPalette | null; revision: number;
};
export function createHomeAmbientTransition(palette: HomeBackgroundPalette): HomeAmbientTransition {
  return { current: palette, previous: null, revision: 0 };
}
export function beginHomeAmbientTransition(state: HomeAmbientTransition, palette: HomeBackgroundPalette, reduceMotion: boolean): HomeAmbientTransition {
  return { current: palette, previous: reduceMotion ? null : state.current, revision: state.revision + 1 };
}
export function completeHomeAmbientTransition(state: HomeAmbientTransition, revision: number): HomeAmbientTransition {
  return state.revision === revision ? { ...state, previous: null } : state;
}
