# Quote Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each quote better match the user's feeling and photo while reducing AI calls and preserving quota, privacy, and output guarantees.

**Architecture:** The quote Edge Function changes from vision-analysis followed by generation to one structured multimodal request. Shared Edge Function helpers own request/output validation and private Responses configuration; the Expo home flow owns non-streaming presentation stages.

**Tech Stack:** Expo React Native, TypeScript, React Native Reanimated, Supabase Edge Functions/Deno, OpenAI Responses API, Jest, Deno test.

**Spec:** `docs/superpowers/specs/2026-09-22-quote-matching-design.md`

## Global Constraints

- Keep the quote API success shape `{ quote, language }` unchanged.
- Treat the typed feeling as the primary matching signal.
- Use no new dependencies, database tables, migrations, endpoints, or secrets.
- Preserve JWT authentication and the server-authoritative quota RPC.
- Set `store: false`; never log photos, feeling text, or generated text.
- Deploy only `quote`, `quote-rewrite`, `quote-future`, and `quote-explain`.

## Review Focus

- A caller sends an overlong source quote; it receives `400` without spending quota.
- A quote model result is empty, generic, too long, or multi-sentence; `/quote` retries once and then rejects it.
- A typed feeling conflicts with the image; prompt order makes the feeling authoritative.
- Generation fails after a stage begins; the UI returns to idle rather than leaving bloom progress visible.
- The remote deployment retains the existing OpenAI secret and JWT function configuration.

---

### Task 1: Harden shared AI request and quote validation

**Files:**
- Modify: `supabase/functions/_shared/ai.ts`
- Create: `supabase/functions/_shared/ai_test.ts`

**Interfaces:**
- Produces: `readQuoteInput(value)`, `validateGeneratedQuote(value)`, and `callOpenAI()` requests with `store: false`.
- Consumed by: all four AI Edge Functions.

- [ ] Write Deno tests for valid 180-character input, rejected 181-character input, and rejected empty/multi-sentence generated output.
- [ ] Run `SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test npx --yes deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/ai_test.ts` and verify the new assertions fail.
- [ ] Add the smallest shared validators, switch the default language to English, and set `store: false` in the shared Responses request type.
- [ ] Re-run `SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test npx --yes deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/ai_test.ts` and verify it passes.
- [ ] Commit: `fix: validate AI quote inputs before generation`.

### Task 2: Replace the two-call quote pipeline

**Files:**
- Modify: `supabase/functions/quote/index.ts`
- Modify: `src/services/ai/client.ts`
- Modify: `src/services/ai/types.ts`
- Modify: `docs/ai-api-contract.md`

**Interfaces:**
- Consumes: Task 1 shared validation.
- Produces: unchanged `{ quote, language }` quote response.
- Consumed by: `useGenerateQuote`.

- [ ] Write a Deno test for structured quote parsing and retry classification before editing quote generation.
- [ ] Run `SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test npx --yes deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/ai_test.ts` and verify it fails because the direct matching helper is absent.
- [ ] Replace the detailed vision schema and second model request with one low-detail, structured multimodal quote request. Place user feeling above photo and traits in the prompt; retain one explicit retry only for a rejected output.
- [ ] Remove unused debug-vision and vision-language client contract fields, then update the API contract.
- [ ] Re-run the Deno test and `npm test -- --runInBand __tests__/aiClient.test.ts`.
- [ ] Commit: `feat: generate quotes from direct moment matching`.

### Task 3: Protect AI extras before quota reservation

**Files:**
- Modify: `supabase/functions/quote-rewrite/index.ts`
- Modify: `supabase/functions/quote-future/index.ts`
- Modify: `supabase/functions/quote-explain/index.ts`
- Modify: `supabase/functions/_shared/ai_test.ts`

**Interfaces:**
- Consumes: Task 1 `readQuoteInput` and `validateGeneratedQuote`.
- Produces: the existing endpoint response shapes.

- [ ] Write Deno tests that prove valid source input is required before reservation and valid generated rewrite/future output remains one sentence.
- [ ] Run `SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test npx --yes deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/ai_test.ts` and verify the new output-validation assertions fail.
- [ ] Validate each request before `assertAndIncrementUsage`; validate quote-producing responses before success.
- [ ] Re-run the Deno tests and focused Jest quote-review tests.
- [ ] Commit: `fix: protect AI extras from invalid quota use`.

### Task 4: Make generation progress meaningful

**Files:**
- Modify: `src/features/home/useHomeCamera.ts`
- Modify: `src/features/home/HomeCameraSection.tsx`
- Modify: `src/components/QuoteInkBloom.tsx`
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Produces: `generationStage: "idle" | "preparing" | "matching" | "writing" | "revealing"` alongside existing progress.
- Consumed by: `HomeCameraSection` and `QuoteInkBloom`.

- [ ] Write a Jest test for the pure stage-label mapping, including idle and failure reset behavior.
- [ ] Run the test and verify it fails before the mapping exists.
- [ ] Add the minimal stage state and a label in the existing bloom; respect the existing reduced-motion behavior and reset every exit path to idle.
- [ ] Re-run the focused test, `npm run lint`, and the full Jest suite.
- [ ] Commit: `feat: show quote matching progress`.

### Task 5: Review and deploy

**Files:**
- Modify: `docs/ai-api-contract.md`

- [ ] Run `SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test npx --yes deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/ai_test.ts`, `npm run lint`, and `npm test -- --runInBand`.
- [ ] Inspect the branch diff for API-shape, secret, and log regressions.
- [ ] Deploy exactly `quote`, `quote-rewrite`, `quote-future`, and `quote-explain` with the linked project ref.
- [ ] Verify deployment with `supabase functions list --project-ref nwaqdinhdtqqdcjcpxnq` and a protected invalid-request call that must return `400` without invoking OpenAI.
- [ ] Commit documentation if deployment verification changes it: `docs: record quote matching contract`.
