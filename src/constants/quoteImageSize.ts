export type QuoteOrientation = "portrait" | "landscape";

/**
 * Display aspect (width / height) shared by every rendered moment card:
 * the Home camera preview, the Ink Bloom generation overlay, the feed card,
 * a friend's post, the Memories feed, the skeleton, the onboarding preview,
 * and the share/export capture.
 *
 * Square cards use the available width without horizontal gutters. Source
 * uploads preserve their aspect ratio within QUOTE_OUTPUT_SIZE below.
 */
export const QUOTE_DISPLAY_ASPECT = 1;

export const QUOTE_OUTPUT_SIZE = {
  portrait: { width: 720, height: 960 },
  landscape: { width: 840, height: 720 },
} as const;
