# Ambient Ink Home design

Status: implementation authorized 2026-10-03. Recommended heart semantics adopted: own favorite, friends love. Automated verification completed; native build and device visual/export verification remain with the user.

## Goal and visual reference

Match the selected Ambient Ink composition: profile avatar / centered Inkly / active palette pill, a square photo-quote card, an external moments/index/heart/share row, and a rounded Gallery / shutter / Memories dock. Home's background follows the actual active card's saved vibe, including horizontal navigation within a stack.

The generated reference is a visual direction, not pixel geometry: use safe-area-aware layout and the app's existing square card ratio. Do not hard-code the pictured iPhone dimensions.

Durable reference: [selected Home screenshot](assets/ambient-ink-home-reference.png). Compare implementation against this file, not an OS temporary screenshot path.

## Layout

- Fixed Home-only header below the top safe area, visible during browsing and capture. Left avatar retains profile/sign-in routing; center uses `APP_BRAND_MARK`; right pill shows up to three palette swatches and its localized name. The pill is informational, not an implied theme picker.
- Start with 20 logical units of horizontal padding, a 56-unit header, 24-unit card corner radius, and a 112-unit rounded dock. Central shutter is 72 units. Icon hit regions are at least 48 × 48 logical units. Put these values in shared Home theme tokens.
- The dock sits above the bottom safe area with 12 units of clearance. Reserve a 64-unit metadata/action row above it, with 12 units between these regions. Derive square card width from available width AND remaining height. Compact devices shrink the card before any control overlaps it. Large text may increase chrome heights; use measured heights rather than a fixed reserve in that case.
- Maintain the existing full-viewport vertical page snapping. Header/footer are outside the paging list; each page reserves their measured space. All Home pages use the same measured geometry so snapping never drifts after a mode change.
- Header/avatar/pill and footer remain screen controls, outside the card export capture tree. Home styling must not leak into login, onboarding, profile, friends, memories, or paywall.

The full root height remains the page interval. Position the card centrally in the space between measured header and footer, using the same Home frame for capture, loading skeleton, and saved cards. Do not change the default shared `getQuoteCardFrame` contract for other screens. Count safe areas once; header/footer measurements exclude safe-area padding. Suppress the toolbar's contents on capture but retain its minimum height, avoiding a page-size jump when switching modes. For enlarged text or landscape where a usable card and all controls cannot fit, show scrollable content within the capture page and an accessible compact saved-card layout rather than a zero-sized card or clipped controls. Restore the current page's offset after a root-height change.

## Active card and palette contract

Introduce one derived active-moment result with card, stack ID, zero-based index, stack count, and resolved palette. Validate an active ID against the currently visible stack; a stale/missing ID falls back to that stack's first card. Returning to capture clears feed identity. Missing/unknown saved vibes use a neutral Mist palette; do not silently use today's personal palette for old cards.

Store selected stack/card IDs as the source of truth; derive indices from current data. Background, pill, and actions update only after a committed horizontal selection or settled vertical page. During vertical dragging, keep the previous committed background and disable heart/share until the next page settles. Ignore null-index viewability entries: the capture header is not a saved stack. Refresh/reordering preserves the selected IDs and adjusts offset without animation. If the card disappears, select the first surviving card in its stack; if the stack disappears, select the nearest surviving vertical page; if none remain, return to capture. Canceled gestures do not update selection.

The API currently maps unknown database vibe keys through the registry's Dawn fallback. Normalize unknown keys to `null` in both photo-list mappers before resolving Home's Mist fallback; do not change the general registry lookup fallback used by other features. Keep nulls in non-Home consumers on their existing default presentation. Saved premium palettes render as historical content regardless of current subscription; selection of a new draft still uses existing eligibility checks.

Background, pill, heart, share, and index consume that same result. For capture, use the existing selection rules. Freeze the draft palette when an image is selected; save that same key. Profile/date changes must not recolor an unsaved draft.

Render a deep palette-tinted base with two broad soft SVG radial washes and a dark central scrim. Crossfade between settled active palettes over 300 ms; reduced motion changes immediately. Only previous/current background layers may be mounted; interrupt rapid changes from the last committed layer without accumulating layers. No continuous drifting animation in this release.

## Header and retained navigation

Use platform serif fonts for the Inkly wordmark (iOS Georgia, Android serif, web Georgia/serif); keep control labels in the existing sans-serif. Preserve quote font/color selections and saved transforms. Do not silently restyle historical quote typography to imitate the mockup.

The existing friends/invite and streak entry points move into an accessible overflow opened from the wordmark area; display a small chevron to disclose the action and label it “Home menu.” Menu contains Friends and the current streak; avatar behavior stays intact. Account/sign-in and streak modals retain their current guards and routes.

## Card, index, and actions

Use one fine palette edge and subdued glow for the Home variant. Remove Home's competing top stripe and four corner brackets. Preserve the photo, quote text, position/scale/rotation, edit affordance, and metadata. Other card consumers keep their current presentation via an explicit `presentation="home" | "default"` prop, defaulting to `default`.

Move Home's share icon, counter, and horizontal stack indicator out of the image. The row reads “Your moments” for owned cards, “Friends' moments” for other owners, and “New moment” for a draft. Index segments represent cards within the current stack, not vertical feed pages. One card has no indicator. Show at most five equal segments; a sliding window follows the active index for larger stacks, accompanied by `current / total` text. Expose an accessible “Moment N of M” label and Previous/Next actions so horizontal swiping is not the only path.

Share exports the active card via its existing mounted capture ref and `useQuoteMomentShare`. Preserve watermark, subscription guard, usage accounting, and quote ID analytics. Do not use the capture-page ref when sharing a feed card. Disable repeat share taps while the export is running; neighboring pre-mounted cards must never register as the active share target.

Acquire the share lock synchronously before awaiting. Hold the selected card/mounted capture target and disable paging, layout-changing actions, editing, and other shares until export/share settles; defer visual feed replacement and geometry changes during that interval. Registration cleanup uses a unique token so cleanup from an older mount of the same quote cannot erase a newer registration. If no image/ref is available, disable share with accessible feedback. Capture errors display a localized failure and release locks in `finally`. Existing Expo native sharing reports sheet completion rather than verified delivery; preserve current usage accounting without promising detection of cancellation or delivery.

Provisional heart behavior: own saved card toggles its existing favorite field; eligible signed-in friends' cards send the existing `love` reaction. Own-card favorite is a persisted toggle with rollback on failure. Friend reaction is an action with success feedback, not a claimed persisted like/unlike toggle, since the current API only sends reactions. Persist favorites only when the current Supabase auth identity owns the row (`card.userId === authUserId`), including an anonymous authenticated user. A legacy guest-ID-only card without matching authenticated row ownership gets a sign-in affordance; do not promise a cloud write based only on a local guest ID. A guest viewing someone else's card gets a sign-in affordance. Private/ineligible cards retain existing reaction restrictions. Keep other emoji reactions reachable through the contextual overflow rather than crowding the dock.

Favorite writes must confirm the returned row ID and value; a no-error response with zero updated rows is failure. Patch feed and matching memory by photo ID using explicit values, not a blind toggle. Ignore late responses after account/identity changes and avoid replacing a newer cache value with an older refresh. Keep one pending write per photo. Verify with current ownership policies during implementation; no policy changes are part of this UI task. Supabase documents that anonymous authenticated users differ from unauthenticated requests and that update rows can be returned using `.select()`. [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security), [update documentation](https://supabase.com/docs/reference/javascript/update).

## Friends' cards in the Home feed

Friends' saved cards are first-class Home cards: they use the same Ambient Ink frame, background transitions, header palette pill, external action row, stack index, and dock as the viewer's own saved cards. This applies to friends' cards returned by the existing Home feed; it does not expand which users/posts the feed fetches or redesign the standalone Friends/Memories routes.

- Resolve the atmosphere and pill from the visible friend's card's saved vibe, never the viewer's current palette, the friend's current profile palette, or the stack's aggregate vibe. A friend's saved Aurora/Prism renders for a free viewer without a palette-selection paywall.
- The header avatar remains the viewer's profile/sign-in entry point. Inside the card and its export, show the actual friend's name/avatar/date. Missing friend data uses a localized “Friend” label and neutral initials/avatar; it must never fall back to the viewer's identity. Owned cards alone may use viewer profile fallback. Date/time formatting uses the app's active language.
- The toolbar reads “Friends' moments.” Its index reflects the visible friend's current stack and resets/reconciles by the same selected-ID rules as owned stacks. Grouping remains owner-separated, even if two owners have the same stack identifier.
- Heart sends a love reaction under existing identity/visibility rules; it never toggles the friend's owner-side `is_favorite` field. Do not fill the heart merely because that friend has favorited their own photo. Reaction feedback appears only after success and remains distinct from an owned favorite toggle.
- Share targets the friend's active card/ref and includes that friend's attribution. Export guards, watermark, and usage allowance belong to the viewer exporting it. Do not accidentally share the viewer's draft or consume an author's subscription allowance.
- Edit, delete, Save, quote-style changes, and AI rewrite controls are unavailable on a friend's saved card. Gallery/shutter still create the viewer's own next draft; they do not alter or inherit ownership from the friend's post.
- Existing server visibility and friendship access remain authoritative. Ineligible/private cards have no reaction action; when a refreshed feed removes a deleted/revoked post, remove its action registration and reconcile selection. A denied/failed action gives feedback rather than changing permissions or treating cached visibility as authorization.

Acceptance fixtures include an owned Dawn card followed by a friend's Sage stack whose second card is Aurora, a friend with missing author metadata, two owners with the same stack ID, and a removed friend post. On every committed selection, photo, attribution, palette, index, heart, and share must agree.

## Dock mode behavior

| State | Left | Center | Right | External heart/share |
| --- | --- | --- | --- | --- |
| Live capture | Gallery | Shutter | Memories | Hidden |
| Saved feed | Gallery | Return to camera | Memories | Active saved card only |
| Unsaved draft | Gallery, with discard protection | Save | Memories, with discard protection | Share only when existing guards allow |
| Generating/saving | Disabled replacement action | Busy, labeled state | Disabled navigation | Disabled |

Returning from feed to camera must not take a photo on the same tap. Keep generation retry, editing, AI review, multi-photo stacking, and save-completion behavior reachable. Navigation/import that would discard a draft requires the existing discard flow or a local discard/cancel confirmation; failed generation retains the photo.

Generation failure remains a draft: Save is disabled until a valid quote exists, Retry stays on the preview, and Gallery/Memories retain discard protection. Include AI review and image-picker/capture activity in the busy guard. Do not clear an existing draft before the user confirms discard and a replacement image is actually returned; canceling the picker preserves the photo, quote, transforms, and palette. Saving failure keeps that draft editable. Successful save keeps the current behavior of clearing the draft and returning to capture while refreshing the feed; Pro users keep their stack session until Finish is pressed. Freeze palette when starting capture/import, so an async result cannot acquire a later palette; release it on cancellation if no draft exists.

Make the existing “On this day” memory available in the Home menu instead of a card-height-changing banner. Only activate the camera when Home is focused, the capture page is settled, there is no selected draft, and no export/modal owns the interaction; returning from feed resumes preview before allowing the next capture. Loading, empty feed, missing photo, and feed-error states keep the new chrome reachable with disabled card actions and a labeled retry where relevant. Keep the current backend generation and existing Ink Bloom stages; redesigning progress estimates is deferred.

## Visual acceptance

The reference's spatial hierarchy is required: centered wordmark, small informational pill, one square photo, light card edge, restrained metadata/action row, and one rounded dock. Historical quote font size/color/placement remain respected, so their typography need not exactly match the generated serif quote. In Home, replace the default border-heavy quote bubble with a protective dark scrim under its actual transformed text bounds; keep a compact opaque panel fallback when contrast cannot be maintained. Apply the same Home treatment to its export. Do not move a user's saved quote to the bottom merely to imitate the reference.

The Home camera preview and saved cards both use the quiet rim treatment. Swatch/name, ambient washes, and rim must resolve from one palette. Compare reference screenshots on a 390 × 844 logical viewport and a compact 320 × 568 viewport; no decorative badge, duplicated share icon, index overlay, or default card brackets remain in Home. Larger-text verification also checks that the centered title does not collide with avatar/pill; allow the pill to wrap/truncate accessibly before shrinking hit areas.

## Verification and boundaries

Use existing React Native, SVG, Reanimated, safe-area, translation, and sharing libraries; no new dependency or database migration. English and Vietnamese strings are required. Benchmark ordinary text contrast at 4.5:1 against the composited background; test bright photos and all palettes. Respect reduced motion and announce action state to screen readers.

Regression coverage focuses on active-card identity across two swipe axes, stale feed refreshes, guest/auth ownership, failed favorite writes, blocked export, and draft palette freezing. On-device visual checks cover compact and larger iOS/Android screens, safe areas, larger text, and exported images. This phase changes Home presentation and its action wiring, not AI/backend contracts.
