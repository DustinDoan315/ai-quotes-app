# plan_fix.md — Inkly Daily Vibes Code Review Fixes

## Overall Assessment

The codebase is well-structured with a clear domain/feature/services separation and strong TypeScript usage throughout. The issues below are targeted bugs, missing edge-case handling, and moderate security/quality concerns — not fundamental architecture problems.

---

## HIGH

### 1. RevenueCat / Auth race condition
**File:** `src/bootstrap/useAppBootstrap.ts` (L86–91)

`bootstrapRevenueCat()` and `bootstrapAuth()` are fired concurrently with `void`. But `bootstrapAuth` → `syncUserProfile` → `revenuecatClient.logIn(userId)` — if RC hasn't finished initializing when auth completes, the `logIn` call fails silently. RevenueCat won't have the correct user identity, breaking entitlement resolution for authenticated users.

**Fix:** Await RC before auth, or guard `logIn` until RC is ready:
```ts
// useAppBootstrap.ts
await bootstrapRevenueCat();
void bootstrapAuth().catch(...);
```

---

### 2. No server-side auth on AI edge function
**File:** `supabase/functions/quote/index.ts`

The function accepts requests with only the public Supabase anon key. Any client that knows the Supabase URL can bypass client-side usage limits and call OpenAI unlimited times.

**Fix:** Verify a valid user JWT inside the function:
```ts
const authHeader = req.headers.get("Authorization");
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace("Bearer ", "")
);
if (error || !user) return jsonResponse({ error: "Unauthorized" }, 401);
```
Then enforce per-user rate limits via a DB counter. Apply the same fix to `quote-explain`, `quote-rewrite`, and `quote-future`.

---

## MEDIUM

### 3. Stale `dailyAiCount` after `resetIfNewDay()`
**File:** `src/features/ai/useGenerateQuote.ts` (L53–74)

`dailyAiCount` is captured at render time by the hook. `resetIfNewDay()` updates the store synchronously, but the closed-over value passed to `canGenerateQuote()` is still the pre-reset count. On the first generation of a new day, the guard runs against the previous day's count.

```ts
// current — reads stale hook value
resetIfNewDay();
const guardResult = guards.canGenerateQuote(dailyAiCount);

// fix — read fresh state after reset
resetIfNewDay();
const { dailyAiCount: freshCount } = useUsageStore.getState();
const guardResult = guards.canGenerateQuote(freshCount);
```

---

### 4. Cooldown `throw` is unhandled by callers
**File:** `src/features/ai/useGenerateQuote.ts` (L88–96, L142–146)

The cooldown check is outside the `try` block, so the thrown error propagates to callers of `generate()`. Callers in `useHomeCamera.ts` call `generate()` without a surrounding catch — this produces an unhandled promise rejection. The special-case catch inside `generate()` at L142 never sees it.

```ts
// current
if (timeSinceLastRequest < COOLDOWN_MS) {
  throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds...`);
}

// fix — consistent with other guards
if (timeSinceLastRequest < COOLDOWN_MS) {
  const waitTime = COOLDOWN_MS - timeSinceLastRequest;
  showToast(`Please wait ${Math.ceil(waitTime / 1000)} seconds before generating again`, "info");
  return null;
}
```
Also remove the corresponding `startsWith("Please wait")` special-case from the catch block.

---

### 5. `dailyQuote` not persisted — wasted usage counter on restart
**File:** `src/appState/quoteStore.ts` (L76–80)

`dailyQuote` is excluded from `partialize`. If a user generates a quote then closes the app, they return to no quote — but the usage counter was already incremented. Free users (2 generations/day) silently lose a generation.

**Fix:** Add `dailyQuote` to `partialize` and clear it when the day resets in `usageStore.resetIfNewDay()`:
```ts
// quoteStore.ts partialize
partialize: (state) => ({
  dailyQuote: state.dailyQuote,   // add this
  savedQuotes: state.savedQuotes,
  recentQuoteIds: state.recentQuoteIds,
}),

// usageState.ts resetUsageForDate — also return { dailyQuote: null }
// or call useQuoteStore.getState().clearDailyQuote() inside resetIfNewDay
```

---

### 6. Content filter false positives
**File:** `src/services/ai/safety.ts` (L1–18)

Substring matching rejects valid motivational quotes:
- `"financial freedom"` → rejected (contains "financial")
- `"pursue the legal path"` → rejected (contains "legal")
- `"defy violence with kindness"` → rejected (contains "violence")
- `"seek medical care"` → rejected (contains "medical")

The profanity list (`["damn", "hell", "crap"]`) also rejects phrases common in motivational contexts ("give a damn", "raise hell").

**Fix:** Replace `includes()` with word-boundary phrase matching. Only reject specific harmful phrases, not topic words:
```ts
const FORBIDDEN_PHRASES = [
  /\bfinancial advice\b/i,
  /\blegal advice\b/i,
  /\bmedical advice\b/i,
  /\bdiagnos(e|is)\b/i,
  /\bkill\b/i,
  /\bsuicid(e|al)\b/i,
];
```

---

## LOW

### 7. Quote ID collision risk
**File:** `src/features/ai/useGenerateQuote.ts` (L120)

`Date.now().toString()` can produce identical IDs in rapid or test-driven calls. `recentQuoteIds` deduplicates by ID, so a collision silently drops an entry.

```ts
// current
id: Date.now().toString(),

// fix
id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
```

---

### 8. `generationIntervalRef` leaks on unmount
**File:** `src/features/home/useHomeCamera.ts` (L83, L155–162)

The progress `setInterval` started in `generateForImage()` has no cleanup if the component unmounts mid-generation. The interval keeps firing and calls `setGenerationProgress` on an unmounted component.

**Fix:** Add a `useEffect` cleanup:
```ts
useEffect(() => {
  return () => {
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
      generationIntervalRef.current = null;
    }
  };
}, []);
```

---

### 9. `profile` not persisted — flash of empty UI on restart
**File:** `src/appState/userStore.ts` (L83)

`profile` is not in `partialize`. On app restart, `profile` is `null` until `bootstrapAuth` re-syncs from Supabase. Any UI reading `profile?.display_name` or `profile?.avatar_url` shows empty/fallback values during the async gap.

**Fix:** Add `profile` to `partialize`:
```ts
partialize: (state) => ({
  profile: state.profile,   // add this
  persona: state.persona,
  guestId: state.guestId,
  ...
}),
```
Trade-off: stale profile data is possible until next bootstrap, which is acceptable.

---

### 10. `getTodayKey()` produces non-zero-padded dates
**File:** `src/appState/usageStore.ts` (L19–22)

```ts
// current — produces "2026-4-10"
return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
```

The format is inconsistent with `formatLocalDateKey()` in `src/utils/dateKey.ts` (which zero-pads). If these keys are ever compared cross-module, mismatches will silently occur.

**Fix:** Use the shared utility:
```ts
import { formatLocalDateKey } from "@/utils/dateKey";
const getTodayKey = (): string => formatLocalDateKey(new Date());
```

---

### 11. Repeated boilerplate across AI client functions
**File:** `src/services/ai/client.ts`

All four functions (`generateQuote`, `explainQuote`, `rewriteQuote`, `generateFutureQuote`) copy the same ~15 lines: env var checks, `fetch()` with identical headers, `response.json().catch(() => ({}))`, and error extraction. This is ~60 lines of duplicated code that drifts over time.

**Fix:** Extract a shared helper:
```ts
async function callEdgeFunction(name: string, payload: object) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase configuration");

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
```

---

### 12. `console.log` in production paths
**Files:**
- `src/features/ai/useGenerateQuote.ts` (L48–50, L105, L126–129, L136–139)
- `src/services/ai/client.ts` (L25–29, L69–73, L86–91)

Verbose logs including raw quote text, base64 image presence, persona traits, and the Supabase API URL are present in the production code path.

**Fix:** Remove or gate behind `__DEV__`:
```ts
if (__DEV__) console.log("AI quote stored RAW", { text: quote.text });
```

---

## Summary

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | High | `useAppBootstrap.ts:86` | RC/Auth race condition breaks entitlement sync |
| 2 | High | `supabase/functions/quote/index.ts` | No server-side auth — AI endpoint publicly callable |
| 3 | Medium | `useGenerateQuote.ts:53` | Stale usage count passed to subscription guard |
| 4 | Medium | `useGenerateQuote.ts:88` | Cooldown throw is unhandled by callers |
| 5 | Medium | `quoteStore.ts:76` | dailyQuote not persisted — free user loses a generation |
| 6 | Medium | `safety.ts:1` | Content filter false positives reject valid quotes |
| 7 | Low | `useGenerateQuote.ts:120` | Quote ID collision risk |
| 8 | Low | `useHomeCamera.ts:83` | Interval leak on component unmount |
| 9 | Low | `userStore.ts:83` | profile not persisted → flash of empty UI |
| 10 | Low | `usageStore.ts:19` | Non-zero-padded date key format |
| 11 | Low | `ai/client.ts` | ~60 lines of repeated boilerplate across 4 functions |
| 12 | Low | `useGenerateQuote.ts`, `ai/client.ts` | console.log in production paths |
