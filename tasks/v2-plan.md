# Home Screen V2 Enhancement Plan

## Context
The current home screen has a camera capture section + vertical snap-scroll feed of friends' quote photos. It has 3 emoji reactions, a message composer, AI rewrite tools, and a streak counter. Users feel the feed is becoming repetitive/boring — need more engagement hooks, discovery surfaces, and delight moments.

---

## Ideas by Category

### A. Feed Engagement (High Impact)

**A1. Morning Vibe Check (Quick Poll)**
- Show a 3-5 option mood selector at the top of the feed each morning (Motivated / Calm / Playful / Bold / Reflective)
- Selection personalizes the AI quote generation for the day and influences the feed palette
- Files: `HomeCaptureFlow.tsx`, `useHomeCamera.ts`, Zustand persona/user store

**A2. Trending Quotes Strip**
- Horizontal scroll row above the feed showing the top 3 most-reacted quotes from friends today
- "🔥 Hot right now" label, tap to jump to that card in the feed
- Files: new `HomeTrendingStrip.tsx`, new `useHomeTrending.ts`, new Supabase query

**A3. Expanded Reactions (Reaction Picker)**
- Long-press any reaction button to reveal a small emoji picker (6-8 options instead of 3)
- Options: ❤️ 🔥 👏 😂 🤯 ✨ 💫 🙏
- Files: `HomeActionBar.tsx`, `useHomeFeedState.ts`

**A4. Quote Reply (Visual Response)**
- "Reply with your own quote" button on each feed card
- Tapping it opens camera with a small thumbnail of the original quote visible in corner
- Creates a visual conversation thread feel
- Files: `QuoteStackEntry.tsx`, `HomeCameraSection.tsx`

---

### B. Personalization & Discovery

**B1. Mood-Based Feed Filter**
- Horizontal pill filters at top of feed: All / Calm / Funny / Bold / Motivated
- Filter applies to the feed's homeVibeKey grouping
- Files: `HomeFeedFlow.tsx`, `useQuotePhotoFeed.ts`

**B2. "This Week's Theme" Banner**
- Each week has a rotating theme (e.g., "Resilience Week", "Gratitude Week")
- Shown as a subtle banner at the top with a prompt — encourages thematic posts
- Files: new `HomeWeeklyTheme.tsx`, new `src/domain/themes/weeklyTheme.ts`

**B3. Your Quote History Strip**
- Small horizontal scroll of YOUR last 7 quotes just below the camera section
- "Your journey this week" — lets users see their own progression
- Files: new `HomeQuoteHistoryStrip.tsx`, query own posts from feed data

---

### C. Gamification & Social

**C1. Streak Leaderboard Card**
- Dismissible card in the feed showing where you rank among friends by streak
- Medals for top 3 (🥇🥈🥉), motivates daily posting
- Files: new `HomeStreakLeaderboard.tsx`, Supabase friends query

**C2. Daily Challenge**
- One friend can "challenge" another to post a quote on a given topic by day end
- Shows as a nudge card in the feed with a countdown timer
- Files: new `HomeChallenge.tsx`, new Supabase table `daily_challenges`

**C3. Combo Streak Bonus (Buddy Streak)**
- If you AND a friend both post on the same day, both get a "buddy streak" badge
- Visible on the streak icon in the header
- Files: `HomeHeader.tsx`, `useStreakStore.ts`

---

### D. Visual / UX Polish

**D1. Parallax Scroll on Feed Cards**
- The background photo on each `QuoteMomentCard` scrolls slightly slower than the card itself (parallax)
- Creates depth and makes scrolling feel cinematic
- Files: `QuoteMomentCard.tsx` (add Reanimated scroll-offset transform)

**D2. Skeleton Loading States**
- Replace blank feed loading with shimmer skeleton cards (3 placeholder cards)
- Makes initial load feel faster and more polished
- Files: `HomeFeedFlow.tsx`, new `QuoteMomentCardSkeleton.tsx`

**D3. Animated Quote Text Entry (Typewriter Effect)**
- When a new AI quote appears on the camera overlay, characters type in one by one
- Typewriter effect using Reanimated / Moti text rendering
- Files: `HomeCameraSection.tsx`

**D4. Haptic Differentiation**
- Different haptic patterns per action: soft click for reactions, strong thud for save, double-pulse for streak milestone
- Files: scattered throughout action handlers (currently uses generic haptics)

---

### E. Utility Features

**E1. Save-to-Roll from Feed (Long-press Context Menu)**
- Long-press any feed card to get a context menu: Save to Camera Roll / Share / Copy Quote
- Files: `QuoteStackEntry.tsx`, `useQuoteMomentShare.ts`

**E2. Quote of the Day Spotlight**
- Pinned card always at position #1 in the feed: the app's curated "Quote of the Day" (not tied to a friend)
- Drives engagement even when friends haven't posted yet
- Files: `HomeFeedFlow.tsx`, new Supabase function or static daily config

**E3. Scheduled Post Reminder**
- User can set a daily reminder time: "Remind me to post my quote at 9 AM"
- Uses existing notification infra from `NotificationStep.tsx`
- Files: `src/features/onboarding/steps/NotificationStep.tsx`, new settings screen option

---

## Priority Recommendation (Quick Wins First)

| Priority | ID | Idea | Effort | Impact |
|---|---|---|---|---|
| 1 | D2 | Skeleton Loading States | Low | High (polish) |
| 2 | A3 | Expanded Reactions | Low | Medium |
| 3 | D3 | Typewriter Quote Effect | Low | Medium (polish) |
| 4 | D1 | Parallax Scroll | Medium | High (delight) |
| 5 | A1 | Morning Vibe Check | Medium | High (personalization) |
| 6 | B1 | Mood-Based Feed Filter | Medium | High (discovery) |
| 7 | A2 | Trending Quotes Strip | Medium | High (social proof) |
| 8 | E2 | Quote of the Day Spotlight | Medium | High (retention) |
| 9 | B3 | Your Quote History Strip | Medium | Medium |
| 10 | C1 | Streak Leaderboard Card | Medium | Medium |
| 11 | E1 | Long-press Context Menu | Low | Medium |
| 12 | D4 | Haptic Differentiation | Low | Low |
| 13 | C3 | Buddy Streak Bonus | High | Medium |
| 14 | A4 | Quote Reply | High | High |
| 15 | C2 | Daily Challenge | High | High |
| 16 | B2 | Weekly Theme Banner | High | Medium |
| 17 | E3 | Scheduled Post Reminder | High | Medium |

---

## Key Files Reference

| File | Role |
|---|---|
| `app/(tabs)/index.tsx` | Main home screen orchestrator |
| `src/features/home/HomeCaptureFlow.tsx` | Upper capture section layout |
| `src/features/home/HomeCameraSection.tsx` | Camera and quote preview UI |
| `src/features/home/HomeFeedFlow.tsx` | FlatList feed implementation |
| `src/features/home/HomeActionBar.tsx` | Bottom action bar |
| `src/features/home/HomeHeader.tsx` | Header with streak, avatar |
| `src/features/home/AiToolsRow.tsx` | AI tools (rewrite, future quote) |
| `src/features/home/useHomeFeedState.ts` | Feed interactions (reactions, messaging) |
| `src/features/quotes/useQuotePhotoFeed.ts` | Feed fetching and refresh |
| `src/features/quotes/QuoteStackEntry.tsx` | Individual feed card entry |
| `src/features/quotes/QuoteMomentCard.tsx` | Quote card UI |
| `src/appState/useStreakStore.ts` | Streak state |
| `src/appState/useUserStore.ts` | User/persona state |
