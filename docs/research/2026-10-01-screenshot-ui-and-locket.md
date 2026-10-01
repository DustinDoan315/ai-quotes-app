# Screenshot investigation and Locket lessons

Initial screenshot and code investigation. The current working tree now uses square, edge-to-edge moment cards and gives feed media an explicit width. Screenshots are observations, not proof of a runtime cause; native device reproduction remains pending.

## Findings

| Priority | Evidence | Finding and smallest next step |
| --- | --- | --- |
| P1 | Image 1: blank content with floating share button | Likely a feed card rather than the compose preview: the share control sits outside captured media. A concrete failure path is now fixed: per-photo URL signing could fail, yielding an empty `imageUrl`; the card then rendered its black background and the first retry was delayed 55 minutes. URL signing is batched, failures are logged by count, and incomplete feed URLs retry after 60 seconds. The provided Expo log has no fatal JS error, so device reproduction is still needed to confirm this was the reported card's cause. |
| P1 | Image 7: identity conflict with no recovery | `supabase-auth.ts:145` chooses linking for anonymous sessions. `WelcomeStep.tsx:205` opens the same login without a sign-in intent. The conflict is legitimate ownership protection, but the offered instruction to sign in has no corresponding recovery action. Add explicit existing-account sign-in versus guest upgrade intent; preserve guest ownership and avoid automatic merging. |
| P1 | Feed versus draft actions | `app/(tabs)/index.tsx:418-429` drives bottom save/share from the camera draft regardless of the visible feed item. A pending draft can leave Save memory visible while viewing another card, and bottom share captures the draft. Use visible-surface state for the action bar; saved-card sharing already exists on the card. |
| P2 | Image 6: layered borders and brackets | This is the compose preview, identified by trash and Edit & style. `HomeCameraSection.tsx:375-493` combines gradient shell, inset mask, hairline, inner border, and four corner marks. `homeVibeFeedFrame.ts:69-90` supplies additional thick accents. Keep one rounded boundary and one subtle accent. |
| P2 | Quote versus author footer | `QuotePositionLayer.tsx:59-102` clamps only to the entire image; the author footer is independently placed at the bottom in `HomeCameraSection.tsx:533-577`. Default quote position is near the bottom. Long text, larger fonts, or dragging can overlap metadata. Reserve footer space or move author/time below the image. |
| P2 | Images 3/5: oversized sample and cramped footer | Both onboarding steps now use a full-width square preview inside a scrolling page, with text and controls keeping their own horizontal spacing. The old fixed height reserves are removed. Verify login link visibility and reachability at large text sizes on a short device. |
| P2 | Concurrent auth taps | Native Apple action remains callable during auth requests; `login.tsx:202` lacks a busy guard. Guard both social handlers against concurrent requests. |

Image 2 is an unrelated chemistry poster. Image 4 is the native photo picker; its thumbnails include older screens and a generic error, but do not establish a current app crash cause.

### Blank card: clarified scroll trigger

**Confirmed on the connected iPhone:** React Native debugger inspection found the feed viewport and page heights around `5.416e26` points. FlatList's measured height was being used to size its own header and pages, allowing a layout feedback loop. This pushed content far outside the screen while the absolute bottom actions stayed visible. The measurement now comes from the bounded Home parent, with explicit native flex styles on Home and FlatList. After the patch, the live viewport is 896 points and the camera canvas is 414×414 points. The earlier signed-URL recovery change addresses a separate defect; it did not establish the cause of this full black view.

User confirms the blank appears when scrolling from capture into the discovery/feed. For a 393×852-point device with 59/34 safe insets, the current shared frame is 393×393: available height after safe areas and the 142-point chrome reserve is 617, so width is the limiting dimension. The feed page still occupies its measured viewport, while the square media is centered inside it. This geometry does not support the card being too tall as the primary cause. These are calculations, not measured device bounds.

`QuoteStackEntry` clips each page to `screenHeight`; `HomeFeedFlow` measures the feed viewport, and the list offsets include the viewport-sized capture header. Review found a separate moving-page cause: `HomeActionBar` was in normal layout flow, and its height changed when reactions appeared or the camera action changed size. That resized the FlatList while it was scrolling and recalculated page/snap offsets. The bar now overlays the list, so its state no longer changes the viewport. The camera card now centers in the visible capture area above the bottom controls. Native reproduction is still needed to confirm these layout fixes and whether the reported black card was caused by a missed signed URL.

The media chain now sets an explicit full width before the square aspect ratio, while the image still fills that measured box. A surviving card share control fits a failed or collapsed media subtree, but does not prove it. The newly added URL-signing warning can distinguish missing signed URLs from layout failure; if the blank remains without that warning, compare card/media bounds and image load errors for the failing photo ID, then compare the same local image with its cloud URL.

The pasted Expo log shows successful JS bundling and no fatal JS exception. It contains repeated Reanimated worklet-serialization warnings; those are separate from the blank image path and do not establish an app crash.

## What to learn from Locket

The supplied Locket screenshot (image 8) has an approximately square photo with a single rounded silhouette, a compact caption pill inside the photo, author/time below it, and reactions/navigation in separate regions. These are observations of that screenshot, not claims about all Locket versions or platforms.

Locket's official [help overview](https://help.locket.com/en/articles/14225418-my-teen-asked-me-to-get-locket-what-is-it) describes close-friend photos and emoji reactions. Its [publisher listing](https://play.google.com/store/apps/details?id=com.locket.Locket) describes saved photo history and reactions without public counts. Its [photo-use explanation](https://help.locket.com/en/articles/14188121-how-does-locket-use-my-photos-and-videos) confirms delivery to widgets and shared history.

For Inkly, borrow the hierarchy: photo first, readable reflection second, metadata outside the photo, and actions appropriate to the visible content. Retain support for longer quotes rather than forcing every reflection into Locket's short caption pill. The app now uses a square card canvas across camera, discovery, memories, onboarding, skeletons, and card share capture; source uploads retain their original proportions and are cropped to the canvas for display.

Do not add chat, public counts, or new social features for this repair. Existing reactions and per-card sharing already cover the relevant interactions.

## Additional report: first save fails in UI but database succeeds

The code permits this mismatch; the exact first-attempt failure is not established without runtime logs.

- `saveUserPhoto.ts:180-187` creates a signed URL after the database insert. A returned signing error triggers row/file deletion, but cleanup errors are unchecked. A thrown signing request is caught by the outer wrapper, which returns null without rolling back the committed row. Either can leave a database row while the UI reports failure.
- `useHomeCamera.ts:470-549` updates local memory, streak, analytics, and the first-save reminder after persistence succeeds, inside the same broad save catch. A synchronous failure there also reports a failed save despite successful persistence. The first-save-only reminder makes this worth checking, but is not a confirmed cause.
- Retries use a new random storage path and a new insert, so this ambiguous outcome can create duplicate memories.

Smallest repair direction: treat confirmed persistence as save success; isolate signing/display and local follow-up errors from persistence errors. Preserve a stable photo identity across retries if a write response is ambiguous. Add a regression check for insert success followed by signing failure and for a local follow-up failure. Do not delete a saved memory merely because its preview URL failed to load.

Useful log messages: `Failed to create a private image URL`, `Failed to save user photo`, and `Failed to save photo`. Compare their timestamps with the inserted row's ID and creation time. A successful storage upload alone is not proof that the `user_photos` row was inserted.

## Remaining verification and repair order

Previously passed 5 targeted suites / 19 tests: feedCardSizing, quoteCardFrame, onboardingQuotePreview, onboardingIntroFlow, authService. The auth reviewer also passed 4 identity-upgrade tests. These checks do not validate native pixels or provide an existing-account recovery test.

1. Reproduce the blank card by scrolling from capture into discovery. Confirm square media bounds and successful image, quote, and author rendering. Check whether URL-signing warnings appear; if the card is still blank without them, compare measured media bounds and the known local image with its cloud image.
2. Fix existing-account recovery and verify guest ownership survives the conflict and explicit account switch.
3. Make bottom actions follow the visible surface; verify pending draft plus feed navigation.
4. Simplify borders and resolve quote/footer collision.
5. Check onboarding on short screens and large system text.

Existing local changes in `src/bootstrap/useAppBootstrap.ts` were left untouched.
