# V2 Emoji Reactions and 3:5 Quote Composition

## Goal

Bring back emoji reactions for friends' quote photos without text replies, and make the quote-photo composition larger and consistent from camera preview through feed and sharing. The visible photo frame is portrait 3:5 on every surface. The quote owner can move the quote anywhere inside that frame before saving.

## User experience

- On a friend's quote, show ❤️, 🔥, 👏, and a `+` control. The `+` opens a small curated emoji picker; tapping an emoji sends it immediately and reuses the existing burst animation.
- Hide reactions for the current user's own photos, guest-only photos, and photos outside the friend feed. Supabase anonymous sign-ins also count as guests and cannot react. Remove the text composer and message-send controls from this flow. Keep existing stored comments untouched.
- Make the photo card wider and taller than V1 while respecting safe areas. On a 390 px phone, target about 366 px wide by 610 px tall, with 12 px side gutters; clamp the frame to available height on short or landscape screens.
- Use the same 3:5 frame in the camera viewfinder, captured-photo preview, feed, memories, and share capture. Source images fill the frame with a consistent cover crop; do not stretch them.
- During composition, drag the quote by its visible handle. Keep the quote within the photo bounds. Tapping the quote retains the existing edit-text behavior. After save, the saved placement is read-only and is reused in feed, memory, and exported share images.
- For photos saved before this change, use the current bottom quote placement.

## Existing implementation and data flow

- `useHomeFeedState` already contains reaction persistence and burst animation, but a feature flag disables the bar. The same hook also contains the dormant message composer.
- `user_photo_reactions` exists in the live Supabase project, but its creation is absent from the repository migration history. The live table has broad policies/grants and a type check limited to `love`, `clap`, and `fire`.
- `HomeCameraSection` sizes the composition from source orientation; `QuoteMomentCard` independently uses a 3:4 portrait frame. Both use cover image rendering, so a shared fixed frame ratio can keep the displayed crop aligned.
- Quote text is currently anchored at the bottom in camera and feed. `saveUserPhoto` stores quote/style data, and `userPhotosApi` maps those fields into feed and memory cards. Sharing captures the rendered feed card.

## Design and data contract

1. Define one portrait frame ratio, 3:5, and shared sizing that uses available width and height. Apply it to camera, preview, feed, memory, and share rendering. Keep the existing source-orientation field for compatibility, but do not let it change the display frame.
2. Store quote position as normalized center coordinates (`quote_position_x`, `quote_position_y`, each 0–1) on `user_photos`. New photos default to the old bottom position; existing rows receive the same default. Clamp coordinates using the rendered quote bounds so text stays inside the visible frame. Carry the values through `saveUserPhoto`, `userPhotosApi`, local `QuoteMemory`, and rendered cards.
3. Add a Pan gesture only to the compose quote layer and keep text editing on its existing tap path. Preserve the camera's existing pinch-to-zoom behavior. Store the last settled normalized coordinates when saving. The feed and share render the same quote layer from those saved coordinates.
4. Reuse the existing reaction table and burst animation. Add stable identifiers for a small built-in set of extra emoji (for example 🥹, ✨, 🫶, 😂, 🎉, 🤍) and extend database validation to match. One authenticated user may have one row per photo and emoji; repeating a reaction is idempotent, including when legacy guest columns are null. Guests, including Supabase anonymous sessions, cannot react.
5. Add a tracked, repeatable migration that creates or reconciles the reaction table for environments where it is absent, removes permissive anonymous/public access and broad policies, and allows only a non-anonymous authenticated user to react as themselves to a non-own photo visible through the friend relationship. Enforce the Supabase JWT `is_anonymous` claim in RLS because anonymous sign-ins use the `authenticated` database role. Keep the existing `comment` column/data for compatibility, but the app no longer writes comments. Do not add counts, notifications, or a reaction inbox in this change.

## Error handling and compatibility

- A failed reaction write produces no success burst; a successful or already-recorded reaction does.
- Position parsing falls back to the legacy bottom placement if a row lacks or has invalid coordinates.
- Existing saved images remain unchanged in storage; all surfaces apply the same 3:5 cover crop at render time.
- Database migration preserves existing valid reaction rows and comment data. Resolve duplicate rows before adding an idempotency constraint if production data contains duplicates.
- No new dependency is required; use the installed Gesture Handler/Reanimated packages.

## Verification

- Test shared 3:5 sizing on a standard phone, a short viewport, and landscape dimensions; verify images are cropped consistently in camera preview, feed, and share capture.
- Test position clamping/normalization and legacy bottom-position fallback, including long quote text and both portrait and landscape source images.
- Test reaction visibility for friend, self, guest, and unrelated photos; test the `+` picker and ensure no message composer remains.
- Verify repeat taps do not create duplicate reactions, migration policies reject anonymous/self/unrelated writes, and valid friend reactions persist.
- Run the relevant Jest tests, lint, and TypeScript validation; apply the migration to a disposable/local database and inspect its policies and constraints before any production rollout.

## Scope boundary

This change restores send-and-burst emoji reactions only. It does not add reaction counts, delivery notifications, text replies, or draggable quote editing after publication.
