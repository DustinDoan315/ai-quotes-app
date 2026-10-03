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
