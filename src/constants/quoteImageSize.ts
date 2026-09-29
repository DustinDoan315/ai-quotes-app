export type QuoteOrientation = "portrait" | "landscape";

/**
 * Display aspect (width / height) shared by every rendered moment card:
 * the Home camera preview, the Ink Bloom generation overlay, the feed card,
 * a friend's post, the Memories feed, the skeleton, the onboarding preview,
 * and the share/export capture.
 *
 * 2/3 sits between the old 3/4 (too short) and 3/5 (too tall) and reduces the
 * cover-crop applied to a 3:4 source photo.
 */
export const QUOTE_DISPLAY_ASPECT = 2 / 3;

export const QUOTE_OUTPUT_SIZE = {
  portrait: { width: 720, height: 960 },
  landscape: { width: 840, height: 720 },
} as const;
