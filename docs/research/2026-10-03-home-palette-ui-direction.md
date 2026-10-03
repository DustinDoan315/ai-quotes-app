# Inkly: palette-driven Home and quote experience

Date: 2026-10-03. Status: research and proposed direction, not an approved implementation spec.

## Intent

Build on the existing color collection to replace Home's fixed dark background and give capture, generation, quotes, cards, and memories a coherent personality. Assumed goal: expressive and personal, with the photo and quote remaining easy to read. The aesthetic recommendations are design hypotheses; the sources support usability principles, not claims of uniqueness or improved retention.

## What the repository already supports

- `src/theme/homeBackgrounds.ts` defines ten palettes, including hex colors and gradient direction: dawn, mist, coral, indigo, forest, ember, sage, midnight, aurora, prism.
- The checked-in `home_backgrounds` migration stores `vibe_key`, `rarity`, and `sort_order`, not hex arrays. Profiles and photos reference a vibe key. This review did not query the live database; deployed schema differences remain unverified.
- `useHomeBackgroundPalette` resolves a profile override or a deterministic identity/date palette, with premium eligibility checks. A profile override takes precedence, so not every user's palette necessarily changes daily.
- `GlobalHomeBackground` currently renders `#09090b` and is mounted at the application root. Simply replacing it would affect other routes as well as Home.
- `HomeBackground` already renders an SVG linear gradient. The capture preview uses `FeedCardVibeGradientShell`; saved cards resolve their saved `homeVibeKey` to local palette colors.
- Card decoration includes a top stripe, an inset border, four corner brackets, and a rarity-scaled shadow. More background color should be accompanied by a reduction in competing decoration.
- Display cards currently use a square aspect ratio. Keep this geometry during the first visual iteration.
- `QuoteInkBloom` already supplies a branded generation animation. The app also has reduced-motion support; extend this rather than create a second animation system.
- Generation progress increases on an interval toward 92%, and the writing label follows a 550 ms timer. These are presentation estimates, not confirmed service stages.

## Three possible directions

| Direction | Character | Tradeoff |
| --- | --- | --- |
| Ambient ink — recommended | Dark tinted canvas, broad color washes, editorial quote styling, one bloom on completion | Needs restrained saturation and careful text surfaces |
| Paper keepsake | Warm paper surfaces, palette-colored edges, printed-photo feeling | Larger departure from the current dark camera and social UI |
| Collectible neon | Strong gradients, luminous frames, prominent palette rarity | Builds on the current collection mechanic, but can overpower personal photos |

Choose ambient ink first. The distinctive feature should be continuity: the same color identity appears around a moment, during its creation, and on its saved artifact.

## Proposed experience

| Area | Proposal | Purpose |
| --- | --- | --- |
| Home | Use the palette's darkest color as the canvas, plus two broad colored washes at opposing edges and a dark center behind the photo | Give the screen atmosphere without competing with the image |
| Header | Small palette swatch and name, e.g. “Today's palette · Dawn”; use “Your palette” for a pinned choice | Make personalization understandable without claiming to detect the user's mood |
| Camera | A quiet preview frame and a palette accent around the capture button; preserve neutral camera controls | Connect creation to the visual identity |
| Quote | Two curated styles: editorial typography with a protective scrim, and a compact readable text panel | Make quotes feel composed while accommodating busy photos |
| Card | One fine palette edge or soft halo; reduce the stripe/bracket/border combination | Let the quote and photo lead |
| Generating | Keep the selected photo visible, show one small ink bloom, and use an indeterminate waiting treatment | Preserve context and avoid implying measured progress |
| Result | One brief bloom/fade when the real result arrives; editing and saving become immediately available | Mark completion without prolonging the wait |
| Saved feed | First release keeps the day's Home atmosphere; later, crossfade to the settled visible card's saved palette | Start simply, then make browsing feel connected to each memory |
| Memories | Repeat saved palette accents in thumbnails and an optional subtle palette strip across the calendar | Create a visual history without changing old memories' identities |
| Sharing | Use the same photo, quote placement, typography, and restrained edge as the saved card, with one small brand signature | Make exports recognizable and faithful to the preview |

Example: Dawn becomes a deep violet canvas with a muted orange edge glow, a violet capture accent, and the same violet/orange identity in the completion bloom and saved frame. Sage becomes a deep teal canvas with a soft mint wash. These are proposed compositions, not fixed color-opacity specifications.

Avoid applying the raw, fully saturated linear gradient to every surface. Screen atmosphere, card edge, and control accent can derive from the same palette at different intensities. Optional grain can add an ink/paper feeling later, but should stay decorative and outside text contrast assumptions.

## Palette and data behavior

1. Reuse the existing local palette registry and saved database keys for the first release. A new database migration is unnecessary for this visual experiment.
2. Keep the current profile override/daily selection rules and subscription eligibility. Describe a palette as daily only when it is actually chosen that way.
3. Freeze the draft palette when a photo is selected/captured. Saving should persist the palette used in that preview, including if a date rollover or profile update happens during editing.
4. Historical cards use their saved key; missing or unknown keys get a documented neutral fallback. Basic rendering of a saved artifact should remain stable regardless of current theme selection.
5. If later adapting colors to a photo, select the nearest curated palette rather than arbitrary AI-generated hex values. The image-detection type has a `colors` field, but its format and availability are not established as a usable palette contract. Do not add an AI call solely for decoration.
6. Move colors into database configuration only if remote palette authoring is a real requirement. Then define validation, cached fallbacks, premium rules, and palette versions or snapshots so updates do not recolor historical exports unexpectedly.

## Research implications

- Apple describes materials as a way to separate foreground controls from background content. Apply that principle to a readable action dock over the gradient; this does not require copying Liquid Glass or adding blur everywhere. [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- WCAG's text contrast benchmark is 4.5:1 for ordinary text and 3:1 for qualifying large text. Check the actual composited photo/gradient/text background, including metadata and exports. A fixed opacity or a white text color alone does not establish readability. [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Apple calls for changing or disabling depth simulation when reduced motion is enabled. Use a static atmosphere and a simple completion state as alternatives to drifting washes, parallax, and bloom movement. [Apple: Reduced Motion evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)
- Microsoft Research's human–AI guidelines emphasize clear capabilities, correction, and recovery. The application here is honest generation messaging, editable results, and preserving the photo after failure. Prefer “Creating your quote…” unless actual service events support more specific stage labels; avoid percentages presented as measured progress. [Microsoft Research: Human–AI interaction guidelines](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)
- Day One highlights rereading memories through On This Day and finding entries through tags/favorites. Inkly already has a past-memory entry point; a preserved visual identity could strengthen that experience. This is an analogy, not evidence that palette decoration increases return visits. [Day One: Features](https://dayoneapp.com/features/)

## First release and validation

First: Home-scoped static palette atmosphere, readable header/action surfaces, and quieter card decoration. Next: align generation and export styling. Later: settled-card background transitions and optional user palette selection. Keep animated mesh gradients, photo-adaptive palettes, and prominent rarity effects outside the first release.

Verify all ten palettes with bright, dark, and visually busy photos; English and Vietnamese quotes; long text and larger accessibility text sizes; guest and signed-in profiles; premium restrictions; missing keys; offline startup; and reduced motion. Check capture, retry, editing, saving, browsing, and export on devices. Ensure no unrelated route inherits the new Home atmosphere unintentionally. Pause any decorative animation while camera capture or offscreen rendering makes it unnecessary.

Success criteria: people can read the quote immediately, identify the primary creation action, distinguish waiting from completion, and recognize the same moment across preview, saved feed, and export. Validate visual preference with a few side-by-side prototypes before making claims about appeal or engagement.
