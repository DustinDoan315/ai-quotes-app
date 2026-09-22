# Quote Matching Design

## Goal

Generate one short quote that reflects the user's stated feeling first, the submitted photo second, and persona traits only as a voice modifier; reduce model calls and make generation progress understandable.

## Decisions

- The typed feeling wins when it conflicts with the photo. The photo supplies a concrete anchor, not an emotional override.
- `POST /quote` keeps its public success response: `{ quote, language }`.
- A photo quote uses one multimodal `gpt-4.1` Responses request with `detail: "low"`; it returns structured `{ quote }`.
- The function retries exactly once only when local validation finds an empty, generic, overlong, or multi-sentence output. The retry explicitly requests a more concrete line.
- No image understanding, quote, feeling, or generated text is logged. OpenAI requests use `store: false`.
- Rewrite, future, and explain validate all inputs before reserving usage. Quote-producing endpoints validate model output on the server.
- The existing ink bloom remains. Its copy advances through `Preparing your moment`, `Finding the feeling`, `Writing your line`, and `Revealing your quote`; these are client-side progress states, not a streamed server protocol.

## Scope

Modify the shared Edge Function helpers, quote/rewrite/future/explain functions, mobile request types, home generation state, bloom presentation, AI contract documentation, and focused tests. Do not add a database table, an analytics event, a dependency, or a new endpoint.

## Error Handling

- A malformed, empty, or overlong source quote returns `400` and never reserves usage.
- A malformed generated quote gets one controlled retry for `/quote`; remaining invalid output returns `500` without exposing OpenAI details.
- Existing `429` limits and authenticated access remain unchanged.

## Verification

- Deno tests cover shared Edge Function normalization and generated-quote validation.
- Jest covers the mobile request contract and generation-stage reset.
- The existing Jest suite and lint must pass before deployment.
- Deploy only the four changed AI functions to project `nwaqdinhdtqqdcjcpxnq`; the already-configured `OPENAI_API_KEY` secret remains untouched.
