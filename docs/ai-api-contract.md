# AI API Contract

Last updated: 2026-09-22

## Current Backend Layout

- Mobile app: Expo / React Native at the repository root
- Backend runtime: Supabase Edge Functions in `supabase/functions`
- Database migrations: `supabase/migrations`

This repository does not currently use a separate `/backend` folder. Supabase functions are the active backend surface for AI features.

## Endpoints

### `POST /functions/v1/quote`

Generates a daily motivational quote from persona traits, an optional image, and an optional one-line feeling. The home flow omits the feeling on the first pass; when `momentContext` is absent, the service infers a fitting mood from the photo and persona traits, using the photo as the primary content signal and the traits only for voice.

Request body:

```json
{
  "personaTraits": ["curious", "optimistic"],
  "base64Image": "optional-base64",
  "momentContext": "optional, maximum 180 characters",
  "language": "vi"
}
```

Success response:

```json
{
  "quote": "Bạn vẫn đang đi tiếp theo cách rất riêng của mình.",
  "language": "vi"
}
```

### `POST /functions/v1/quote-explain`

Explains the emotional meaning of a generated quote.

Request body:

```json
{
  "quote": "You are still showing up.",
  "personaTraits": ["curious", "optimistic"],
  "language": "en"
}
```

Success response:

```json
{
  "explanation": "It reminds you that consistency matters, even when progress feels small.",
  "language": "en"
}
```

### `POST /functions/v1/quote-rewrite`

Rewrites a quote in a target tone.

Supported tones:

- `funny`
- `savage`
- `calm`

Request body:

```json
{
  "quote": "You are still showing up.",
  "personaTraits": ["curious", "optimistic"],
  "tone": "calm",
  "language": "en"
}
```

Success response:

```json
{
  "quote": "You do not need to rush to prove your progress.",
  "language": "en",
  "tone": "calm"
}
```

### `POST /functions/v1/quote-future`

Generates a future-facing follow-up quote from an existing quote.

Request body:

```json
{
  "quote": "You are still showing up.",
  "personaTraits": ["curious", "optimistic"],
  "language": "en"
}
```

Success response:

```json
{
  "quote": "Tomorrow gets easier when today is honest.",
  "language": "en"
}
```

## Validation Rules

- `personaTraits` is required and normalized to 8 items max.
- Trait strings are trimmed and limited to 40 characters.
- Source quotes are non-empty and at most 180 characters; generated quotes must also be one sentence.
- Explanations are capped at 320 characters.
- Invalid or missing payload fields return `400`.
- Missing `OPENAI_API_KEY` returns `500`.
- `momentContext` remains optional for backwards compatibility. It is honored when supplied, but it is not required for initial quote generation.
- `quote-rewrite` is the optional post-generation path for changing the quote mood to calm, funny, or savage; it is not part of the initial capture flow.

## Local Setup

Required environment:

- App `.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Supabase function secret for AI functions: `OPENAI_API_KEY`
- Subscription function secrets: `REVENUECAT_SECRET_API_KEY` and
  `REVENUECAT_WEBHOOK_SECRET`

Common commands:

- `npm test -- --runInBand`
- `npm run lint`
