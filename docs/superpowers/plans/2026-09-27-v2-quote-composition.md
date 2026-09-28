# V2 3:5 Quote Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use one larger 3:5 quote-photo frame from camera through saved memories, feed, and share, with quote placement editable by dragging during composition.

**Architecture:** Add shared frame sizing and normalized quote-position math, persist quote position on `user_photos`, then render that position through a shared layer on compose, feed, and memory cards. Keep source images unchanged apart from the existing size reduction; all visible surfaces use `cover` inside the same 3:5 frame.

**Tech Stack:** Expo Camera, React Native, Gesture Handler, Reanimated, Supabase/Postgres, Jest.

**Spec:** [2026-09-27 V2 design spec](../specs/2026-09-27-v2-emoji-reactions-and-3x5-quote-composition-design.md)

## Global Constraints

- The visible photo frame is portrait 3:5 on every surface.
- On a 390 px phone, target about 366 px wide by 610 px tall, with 12 px side gutters; clamp the frame to available height on short or landscape screens.
- Store quote position as normalized center coordinates (`quote_position_x`, `quote_position_y`, each 0–1).
- Existing rows and invalid/missing positions use the current bottom quote placement.
- Source images fill the frame with a consistent cover crop; do not stretch them.
- No new dependency is required; use the installed Gesture Handler/Reanimated packages.

## Review Focus

- **Short and landscape viewports:** frame must remain within the measured available height. Pin in Task 1 sizing tests.
- **Portrait and landscape source images:** both must show the same 3:5 cover crop in camera, feed, and share. Verify in Task 3 device check.
- **Missing or invalid saved coordinates:** quote must use the legacy bottom placement. Pin in Task 2 position tests.
- **Long quote bounds:** the measured quote box must remain fully inside the photo. Pin in Task 2 clamp tests.
- **Gesture interaction:** quote movement must not break pinch-to-zoom or text editing. Verify in Task 3 device check.

---

### Task 1: Shared 3:5 frame size

**Files:**
- Modify: `src/constants/quoteImageSize.ts`
- Modify: `src/features/quotes/feedCardSizing.ts`
- Modify: `__tests__/feedCardSizing.test.ts`

**Interfaces:**
- Produces: `QUOTE_DISPLAY_ASPECT = 3 / 5` and `getQuoteFrameSize(viewportWidth: number, availableHeight: number): { width: number; height: number }`.
- Keep source `QuoteOrientation` and `QUOTE_OUTPUT_SIZE` behavior intact; display ratio no longer follows source orientation.

- [ ] **Step 1: Write failing size tests**

Add named tests `usesTheLargerPhoneFrame`, `clampsToShortViewportHeight`, and `keepsTheTabletWidthCap` with these assertions:

```ts
expect(getQuoteFrameSize(390, 796)).toEqual({ width: 366, height: 610 });
expect(getQuoteFrameSize(844, 342).height).toBeLessThanOrEqual(342);
expect(getQuoteFrameSize(844, 342).width).toBeCloseTo(205.2);
expect(getQuoteFrameSize(1024, 1100).width).toBe(620);
```

- [ ] **Step 2: Run the sizing test**

Run: `npm test -- --runInBand __tests__/feedCardSizing.test.ts`
Expected: FAIL because `getQuoteFrameSize` and the new display ratio are not defined.

- [ ] **Step 3: Implement shared frame sizing**

Implement `getQuoteFrameSize` in `src/features/quotes/feedCardSizing.ts`. Use 24 px total horizontal margin on phones, the existing 96 px tablet margin, existing 448/620 px width caps, and clamp width by `availableHeight * QUOTE_DISPLAY_ASPECT`; do not apply the old 280 px minimum after the height clamp.

- [ ] **Step 4: Run the sizing test**

Run: `npm test -- --runInBand __tests__/feedCardSizing.test.ts`
Expected: PASS for phone target, tablet cap, and short/landscape clamp.

- [ ] **Step 5: Commit**

```bash
git add src/constants/quoteImageSize.ts src/features/quotes/feedCardSizing.ts __tests__/feedCardSizing.test.ts
git commit -m "feat: define shared 3x5 quote frame sizing"
```

### Task 2: Quote position model and persistence

**Files:**
- Create: `src/features/quotes/quotePosition.ts`
- Create: generated migration from `npx supabase migration new persist_quote_photo_position`
- Modify: `src/services/media/saveUserPhoto.ts`
- Modify: `src/services/media/userPhotosApi.ts`
- Modify: `src/types/memory.ts`
- Modify: `src/appState/memoryStore.ts`
- Modify: `src/features/home/useHomeCamera.ts`
- Test: `__tests__/quotePosition.test.ts`

**Interfaces:**
- Produces: `type QuotePosition = { x: number; y: number }`, `type QuoteBoxSize = { width: number; height: number }`, `DEFAULT_QUOTE_POSITION = { x: 0.5, y: 0.84 }`, `parseQuotePosition(x: unknown, y: unknown): QuotePosition`, and `clampQuotePosition(position: QuotePosition, frame: QuoteBoxSize, quote: QuoteBoxSize): QuotePosition`.
- `saveUserPhoto` accepts `quotePosition: QuotePosition`; `QuotePhotoCard` and `QuoteMemory` carry `quotePosition` with the default used for legacy rows.

- [ ] **Step 1: Write failing position tests**

Add named tests `usesLegacyPositionForInvalidCoordinates` and `clampsTheQuoteBoxToAllFourEdges` with these assertions:

```ts
expect(parseQuotePosition(null, Number.NaN)).toEqual(DEFAULT_QUOTE_POSITION);
expect(parseQuotePosition(-0.1, 1.1)).toEqual(DEFAULT_QUOTE_POSITION);
expect(clampQuotePosition({ x: 0, y: 1 }, { width: 200, height: 400 }, { width: 40, height: 80 }))
  .toEqual({ x: 0.1, y: 0.9 });
expect(clampQuotePosition({ x: 1, y: 0 }, { width: 200, height: 400 }, { width: 40, height: 80 }))
  .toEqual({ x: 0.9, y: 0.1 });
```

- [ ] **Step 2: Run the position test**

Run: `npm test -- --runInBand __tests__/quotePosition.test.ts`
Expected: FAIL because the position module is not defined.

- [ ] **Step 3: Implement normalized position helpers**

Implement the two functions in `src/features/quotes/quotePosition.ts`. Treat x/y as normalized center coordinates and clamp each center using the rendered quote bounds; fall back to the default when inputs are not finite or outside 0–1.

- [ ] **Step 4: Add the photo-position migration**

Check `npx supabase --version` and `npx supabase migration --help`, create the migration with the CLI command above, and add `quote_position_x`/`quote_position_y` as non-null `double precision` columns defaulting to `0.5`/`0.84`, each constrained to 0–1. Do not apply this migration to the linked production project.

- [ ] **Step 5: Carry position through save, feed, and memory data**

Add both fields to the user-photo select list and Zod row schema in `userPhotosApi.ts`; map them with `parseQuotePosition` in both list functions and `quotePhotoCardToMemory`. Add the position to `QuoteMemory`, its store constructor, and the `useHomeCamera` save call. Pass the selected coordinate to `saveUserPhoto` when inserting a row.

- [ ] **Step 6: Run focused verification**

Run: `npm test -- --runInBand __tests__/quotePosition.test.ts __tests__/memoryStoreIdentityUpgrade.test.ts`
Expected: PASS; TypeScript accepts the new optional legacy-compatible memory field.

- [ ] **Step 7: Commit**

```bash
git add src/features/quotes/quotePosition.ts src/services/media/saveUserPhoto.ts src/services/media/userPhotosApi.ts src/types/memory.ts src/appState/memoryStore.ts src/features/home/useHomeCamera.ts __tests__/quotePosition.test.ts supabase/migrations
git commit -m "feat: persist quote photo placement"
```

### Task 3: Apply the frame and draggable quote layer

**Files:**
- Create: `src/features/quotes/QuotePositionLayer.tsx`
- Modify: `src/features/home/HomeCameraSection.tsx`
- Modify: `src/features/quotes/QuoteStackEntry.tsx`
- Modify: `src/features/quotes/QuoteCardSkeleton.tsx`
- Modify: `src/features/quotes/QuoteMomentCard.tsx`
- Modify: `src/features/quotes/QuoteMomentCardMedia.tsx`
- Modify: `src/components/MemoryCard.tsx`
- Modify: `app/memories/day.tsx`

**Interfaces:**
- Consumes: `QuotePosition`, `DEFAULT_QUOTE_POSITION`, `clampQuotePosition`, and `getQuoteFrameSize` from earlier tasks.
- Produces: a `QuotePositionLayer` that accepts `position`, `children`, and optional `onPositionChange`; it renders an accessibly labeled move handle only when movement is enabled and reports a clamped normalized position after drag. `MemoryCard` accepts an optional `quotePosition` and defaults old local memories to `DEFAULT_QUOTE_POSITION`.

- [ ] **Step 1: Implement the shared positioned layer**

Measure the frame and child box; position the child by its normalized center; clamp movement using `clampQuotePosition`. Attach a Pan gesture to the visible move handle only, so tapping quote text still opens the editor and the camera's outer pinch gesture remains available.

- [ ] **Step 2: Use the layer in camera composition**

Use a measured available-height frame from the camera section, apply `QUOTE_DISPLAY_ASPECT` to both the live `CameraView` and selected-photo preview, and render the quote at the current position through `QuotePositionLayer`. Keep the author/date overlay fixed; moving the quote must not move that metadata. Persist every settled drag position through the Task 2 save call.

- [ ] **Step 3: Use the layer in feed and memory cards**

Replace bottom-anchored quote text in `QuoteMomentCardMedia` and `MemoryCard` with the same positioned layer, pass each card's saved position, and set each image viewport to `QUOTE_DISPLAY_ASPECT` with `contentFit="cover"`. Keep author/date and memory controls anchored independently.

- [ ] **Step 4: Size feed stacks, skeletons, and memory cards**

Use `getQuoteFrameSize` in `QuoteStackEntry`, `QuoteMomentCard`, and `QuoteCardSkeleton`; use its width and the 3:5 ratio in `MemoryCard`. Keep the feed's existing safe-area/vertical padding and clamp to the remaining card height.

- [ ] **Step 5: Verify the integrated UI**

Run: `npm test -- --runInBand __tests__/feedCardSizing.test.ts __tests__/quotePosition.test.ts`
Run: `npm run lint`
Run: `npx tsc --noEmit`
Expected: all commands pass. In the app, verify portrait and landscape source images show the same 3:5 crop in the live camera view, captured preview, feed, memory card, and share export; drag to all four corners and confirm no text clipping; confirm pinch-to-zoom and tap-to-edit still work.

- [ ] **Step 6: Commit**

```bash
git add src/features/quotes src/features/home/HomeCameraSection.tsx src/components/MemoryCard.tsx app/memories/day.tsx
git commit -m "feat: position quotes in a shared 3x5 photo frame"
```
