# Ambient Ink Home test cases

Run automated checks with:

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Automated coverage:

| Area | Test file | Cases |
| --- | --- | --- |
| Active palette | `activeHomeMoment.test.ts` | Own Dawn, friend Sage, friend second Aurora, unknown vibe → Mist, stale IDs, bounded index window |
| Two-axis selection | `homeActiveSelection.test.ts` | Canceled drag, horizontal reorder, refresh insertion, deletion, account switch, export lock |
| Paging integration | `homeAmbientFlow.test.ts` | Full-root settled offsets, vertical dragging allowed, horizontal/export locks, Retry reachable without feed cards |
| Background | `homeAmbientTransition.test.ts` | Rapid changes, stale completions, bounded layers, reduced motion |
| Geometry | `homeViewportLayout.test.ts` | Safe areas, compact/short viewports, measured chrome, nonnegative frames |
| Share registry | `homeActiveShare.test.ts` | Stale card ID, same-ID remount cleanup, duplicate requests, capture errors |
| Export hook | `quoteMomentShare.test.ts` | Synchronous lock, blocked allowance, missing ref, frame/capture errors, watermark reset, successful accounting |
| Attribution | `homeFriendCard.test.ts` | Missing friend metadata never uses viewer identity, saved transforms, active-only share registration |
| Heart | `homeMomentHeart.test.ts` | Anonymous-auth ownership, legacy guest sign-in, private friends, friend favorite bit ignored, rollback, repeated taps, late account responses |
| Favorite cache | `homeFavoriteCache.test.ts` | Stale reads during writes, rollback, fresh server reads including changes from Memories |
| Reactions | `homeReactionSelection.test.ts` | Secondary emoji targets committed card regardless of neighboring viewability; capture has no reaction |
| Draft flow | `homeDraftPalette.test.ts` | Delayed camera/import palette freeze, canceled replacement, failed save, generation retry, clear/success release, Pro stack continuation/Finish |
| API | `userPhotosApi.test.ts` | Both list paths normalize unknown vibes, valid premium palettes preserved, exact favorite row/value confirmation and zero-row rejection |
| Grouping | `groupQuotePhotoCardsIntoStacks.test.ts` | Two owners sharing a stack identifier stay separate |

## Device handoff after your build

Native build and device verification were intentionally not run. Record results below after building:

- [ ] Compare with the selected reference on 390 × 844 and 320 × 568; header stays centered, card and dock do not overlap.
- [ ] Test enlarged text and Vietnamese labels, portrait/landscape, and reduced motion.
- [ ] Browse own Dawn → friend's Sage → second Aurora; background, pill, index and export all follow the visible card.
- [ ] Test all ten saved palettes as a free viewer. New draft palette selection still follows subscription rules.
- [ ] Rapid vertical/horizontal swipes, canceled drags, refresh insertion/deletion, and account switching.
- [ ] Favorite your card, toggle in Memories, return Home; latest persisted value appears. Friends' heart sends love without changing their favorite.
- [ ] Export own/friend/second-stack cards. Check friend attribution and saved transforms; screen header, dock, index, heart and editing controls stay out of the image.
- [ ] Export allowance denial, share failure, missing/offline photo, and returning from the native share sheet.
- [ ] Camera/gallery permission denial, canceled replacement, generation retry, quote editing, Save failure/success and Pro Finish.
- [ ] Unsaved-draft discard/cancel before Memories/Profile/Friends; On This Day and secondary reactions remain available from Home menu.
- [ ] Camera pauses on saved feed, menu and export; resumes on settled capture.
- [ ] Check actual gradients/shadows/photo contrast on iOS/Android, including bright busy images. Capture reference screenshots.

The original Home layout change did not alter database policies. The later custom emoji migration is described below. A real authenticated favorite write/read and native export capture remain device checks.

## Discovery polish and development reaction preview

- In a development build with a saved photo, open the Inkly menu and enable “Test friend feed · DEV”. Swipe into the demo friend stack. Test both cards, the friend attribution, vibe changes, heart, and emoji buttons under the card. Reactions animate locally without network requests. Demo sharing is disabled. Use “Remove demo friend · DEV” to remove the fixture.
- Confirm both the demo toggle and fixture cards are absent in release builds. Real friends use the same emoji row under their feed cards.
- Confirm discovery cards have balanced space between the header and bottom toolbar; the camera now sits slightly above the center of its available area.
- Save a quote, reopen Home to refresh cloud memories, then open its Memories day. Confirm one entry per saved photo; separately saved photos remain separate.
- Open Streak on a compact screen and with larger text. Confirm content scrolls and the bottom-right Close button remains accessible.

## Expanded emoji picker

- On a friend or demo card, confirm one row of four quick emojis and a More (•••) button.
- Tap More, search for an emoji, and select a face, flag, family sequence, or skin-tone variant. Confirm the picker closes and the exact selected emoji animates.
- Close/dismiss without selection; confirm no reaction is sent. Switching cards or starting export must close the picker.
- Real custom emoji reactions require `20261003100000_allow_custom_emoji_reactions.sql` to be applied to Supabase. This migration preserves friend authorization and duplicate protection. Demo reactions remain local.
- Database pgTAP tests were updated but not run locally; no PostgreSQL/Supabase CLI was available. Native picker keyboard/safe-area behavior needs the user’s build check.

## Camera spacing and background continuity

- On compact and tall devices, confirm the camera is closer to the header, retains its full width, and leaves room above the fixed zoom controls and dock.
- Swipe slowly and rapidly across three cards with different vibes. The current background blend should finish before the latest requested color blends in, with no flash or snap to an intermediate color.
- Swipe sideways through a stack, then vertically away and back. Confirm images remain visible and the outgoing page does not jump to its first quote.
- Enable Reduce Motion during a blend. The latest palette should appear immediately and no queued animation should resume.

### Signed-in profile polish
- Open an Apple/Google account profile: avatar, name, verified account and identity sit together above the Pro card; long names wrap without pushing controls offscreen.
- Edit: close cancels; Save stays disabled for invalid/unchanged names; saving and avatar upload retain their busy overlays.
- Switch Vietnamese/English: both app and quote language update; selected option is visibly highlighted.
- Reminder: toggle, time picker and next reminder label retain their existing behavior.
- Delete account initially shows a collapsed row. Expanding reveals the removal and subscription warnings, subscription link and delete button. Delete still opens the existing confirmation; Cancel keeps the account.
- Check scrolling and readability on a small device and with larger text, especially reminder labels and the expanded deletion warning.

### Profile edit layout
- Profile avatar displays at 104pt; the camera badge stays attached at its lower right.
- Enter Edit: only avatar and display-name/bio fields remain, without Pro, account/settings, or destructive actions. Keyboard opening should keep fields reachable by scrolling.
- Name input permits up to 40 characters; bio up to 200, with matching counter. Save retains validation and persists the values; Close discards text edits. Avatar uploads still save immediately through their existing flow.
- Delete disclosure centers the icon and label together, with its chevron at the right. Identity no longer repeats the dedicated streak summary.

### Memories calendar and day navigation
- Open Memories directly after returning social sign-in: own cloud cards load independently of Home; calendar counts/thumbnails update when loading completes.
- Offline refresh preserves cached cards. Mine and calendar must show only current account/guest-owned cards; switching accounts must not relabel old guest cards.
- Calendar fits seven columns on smaller devices; today uses lavender. Move from January 31 to the next month: February must not be skipped.
- Day header shows distinct adjacent dates. Swipe right goes back one day; swipe left goes forward one day. Next is disabled at today. Vertical scrolling and pull-to-refresh still work.
- Navigate days rapidly on Friends: a delayed previous-day response must not replace the current day's cards. Each new day starts at the top.

### Day transition and visible cards
- With Mine showing 3, all three card containers and their quotes must render immediately; only the selected tab mounts a list.
- Previous day enters from the left, next day from the right. The calendar back action retains normal navigation. Reduce Motion skips the horizontal transition.
- An available local image remains visible while its Storage URL is signing, including network failure. Fresh signed URLs replace it on success.

### Returning account guest merge
- Sign out, create three guest photos, sign in with an existing Apple/Google account. The same photo IDs appear in Home and Memories with preserved quote transforms/favorites and target-owned storage paths. Anonymous source Auth account is removed only after transfer/storage cleanup.
- Disable network during transfer, reopen Memories and pull to refresh: pending transfer resumes without duplicate photos. Cache/proof remain intact on error; account login itself remains usable.
- Try another destination during a pending transfer: reject changing the destination. Never merge guest records by a guest ID alone.
- Fresh provider linking keeps the same UUID and does not delete the upgraded account. Cancelled login then successful same-UUID linking clears only its unbound pending proof.
- Previously lost guest credentials require trusted one-time recovery: use Profile's DEV-only Copy memory recovery info button. It includes IDs only and is absent from release builds.
# Caption sizing and conversational wording — October 3

- Pinch a new caption down to 55%, drag and rotate it, then save. Reopen it in Home, Memories, and export; the smaller transform should remain intact for both your own cards and friends’ cards.
- New captions start slightly lower. Previously saved caption positions remain unchanged. Check white text remains readable against bright and dark photos with the softer background.
- Generate and rewrite captions in English and Vietnamese for bored, playful, quiet, and sad moments. Expect natural everyday wording; short fragments, occasional stretched words, and up to two relevant emoji are allowed. Emoji and stretched words should not appear on every result, and calm rewrites should stay understated.
- Confirm captions still respect the original feeling, photo, rewrite meaning, and 180-character limit. Existing saved quotes are not rewritten automatically.

### Photo onboarding example

- Fresh install, offline: onboarding shows the bundled coffee photo on both steps; no gradient-only preview or network dependency.
- Step 1: photo appears before the matching caption, “coffee first, everything else can wait ☕”; caption sits low without covering the author label.
- Step 2: same photo and caption remain, with the actual Inkly logo and AI photo quote watermark only at the top right.
- English and Vietnamese: caption and author label are translated; no clipped caption or overlap at large text sizes.
- Reduce Motion enabled: caption is immediately visible without an entrance animation.
- Small phone and landscape: photo stays within screen edges; scroll to the CTA; Back, Skip, and completion keep their existing behavior.

### Caption edit handles

- On the first generated own card, a violet caption outline, pencil, and resize corner appear briefly; no explanatory text occupies the photo or footer.
- Tap the caption after the hint disappears: controls return without opening the keyboard. Tap the pencil: existing text editor opens; save/cancel work.
- Drag the caption: position changes. Drag the resize corner inward/outward: caption shrinks/grows within 0.55–1 without being translated. Pinch and rotation still work.
- Move the caption to every edge, resize at minimum size and after rotation: handles stay tappable; keep dragging for more than eight seconds without losing the active handle.
- Relaunch after the first hint: it does not replay. Generate another photo: controls start hidden until tapped. Storage read/write failure must not crash.
- Friend cards and memory cards never show editing controls.
- Share Free and Pro drafts while controls are selected: exported photo contains no border, pencil, handle, or helper text. Saving/generating/reviewing a rewrite also disables the controls.
- VoiceOver: caption announces adjustment instructions, pencil announces text editing, and resize handle supports increment/decrement actions. Both English and Vietnamese labels work.

### Single natural Rewrite action

- Generating: photo and progress only; no size/color panel, tone chips, Next, or advanced-style toggle.
- Generated draft: one compact Rewrite button beneath the card; caption tap/pencil/move/resize still work. New draft text is white and medium base size.
- Rewrite preserves the photo's original meaning/mood and offers noticeably different natural wording. Preview appears before changing the current quote; Cancel keeps the original, Apply uses the reviewed text.
- Repeated rapid taps start one request. Changing/clearing the photo or leaving Home while a rewrite is pending cannot apply a stale result.
- Error/AI limit: no quote replacement; existing toast/paywall remains and retry is possible.
- Applying does not add a duplicate result box. Existing saved cards keep their stored size/color. Rewrite stays clear of the fixed bottom dock on small screens; pending review does not shift the card frame.


## Quiet canvas draft editor

- Take or select a photo: the full-width card starts below the header; the camera dock is replaced by Rewrite, Save, and Share. On compact screens, scroll to reach the controls.
- While generating or rewriting, the photo stays visible with a slow theme-colored edge glow and a single status label. Reduce Motion uses a static edge.
- Confirm that only the actual caption fades into its lower position; drag, resize, and edit it before saving.
- Back and the top-right trash ask before discarding an unsaved photo. Cancel retains the draft; discard cancels any pending generation.
- Saving marks the moment Saved and freezes its caption so sharing matches the stored moment.
- Shared images include the watermark but no glow, trash, or action controls. Check all Home palettes, including Forest, Dawn, and Mist.

## Responsive Home and generated drafts

Automated geometry coverage: 320×568, 375×667, 390×844, 430×932, 360×640, and 768×1024, with device safe areas, header heights of 56/84, and dock heights of 188/260.

- Camera/feed cards fit between the measured header and dock. Standard phones retain their edge spacing; short screens fit the available height. Tablet cards cap at 600 points.
- Draft cards retain their width and scroll with naturally measured controls, including wrapped action labels and error/rewrite content.
- Below 360 points or above 1.2× text scaling, the vibe pill moves beneath the centered brand. Check English and Vietnamese labels at the largest system text setting.
- On a device, rotate where supported, open the keyboard to edit a caption, dismiss it, and verify the save/share controls remain reachable. Check export dimensions after any viewport change.
- Native screenshots and touch/keyboard checks remain required; automated geometry does not verify native text rendering or gestures.

## Generated-card control regression

- New captions start at 72% of card height, above the author/date footer. Existing saved caption coordinates remain unchanged.
- Rewrite/Save/Share retain visible button surfaces; the trash control stays in the top-right with a 48-point target. Check Vietnamese labels too.
- Selected captions show 44-point edit/resize controls outside the text. Verify taps at minimum scale, resize diagonally, pinch/rotate, and drag near the top edge (controls flip below). Android controls remain inside the interaction parent.
- Processing the selected photo immediately starts the edge glow; it continues through network generation and caption reveal. Reduce Motion shows a static edge. Export contains no editor controls or glow.
- Verification: 316 tests / 59 suites, strict unused-local TypeScript, and scoped lint pass. Native animation/touch behavior still requires device verification.

## Centered generation canvas and floating toolbar

This supersedes the earlier draft layout and caption-handle checks.

- Draft cards center vertically between the measured header and bottom toolbar; compact phones fit the available height. Generation and completion keep the same card geometry.
- A single rounded, theme-colored toolbar stays above the bottom safe area. Save is primary; status fades into actions. Expanded text reserves its measured toolbar height through loading.
- A broad translucent halo and slow perimeter highlight show preparation/generation; Reduce Motion retains a static illuminated edge. The fixed draft canvas does not clip the halo in a ScrollView.
- No caption edit/resize icons or selection outline. First-use hint stays until a caption touch, then dismisses and persists. Tap edits, drag moves, pinch resizes, two-finger rotation remains available; VoiceOver supports edit and size actions.
- Inkly menu → Caption help replays the hint for an editable draft. Saved coordinates and export contents remain unchanged; hints, halo, and toolbar do not appear in captured images.
- Verification: 321 tests / 60 suites, strict TypeScript including unused locals/parameters, and scoped lint passed. Native animation, keyboard, and gesture verification remain required; no native build ran.
