# Home Action Labels, Invite Sharing, and Automatic Quote Mood Spec

**Date:** 2026-09-25
**Status:** Implemented locally; web deployment and device verification remain

## User Request

The attached screenshot is a visual reference only. The requested product changes are:

- Remove the `Saving memory…` label while a memory is being saved; keep a loading indicator in the save control.
- Remove the `Share image` label; keep the existing share icon and share behavior.
- Fix friend invite sharing with one public HTTPS invite URL that opens Inkly when installed and falls back to the public App Store destination when it is not:
  `https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001`
- Preserve `inkly://invite/<code>` only for backward compatibility with older shared links; it should no longer be the generated share or QR value.
- Do not ask the user to choose a mood before the first quote. Generate a mood automatically from the photo and persona, then let the user optionally rewrite the result in another mood.

## Current Implementation Findings

- `src/components/CameraActionsBar.tsx` renders the save spinner and `camera.savingButton` copy together.
- The same component renders the existing `share-outline` icon and `camera.shareImageButton` copy together.
- `src/services/inviteApi.ts` currently creates only `inkly://invite/<code>` links.
- `app/(tabs)/friends.tsx` shares that custom-scheme URL as both the message URL and the share payload URL, and QR codes use the same value.
- The app declares the `inkly` scheme in Expo/iOS/Android configuration, so it can work in an installed standalone build, but a custom scheme has no web fallback and is not a reliable public link in every messaging or QR context.
- The app has no configured iOS Associated Domain, Android HTTPS App Link intent filter, `apple-app-site-association`, or `assetlinks.json`. Therefore there is currently no single HTTPS URL that can route into the installed app.
- The App Store URL is owned by Apple and is only a download destination; it cannot be configured as Inkly's Universal/App Link host and cannot by itself carry the invite code into the app after installation.
- A developer-controlled HTTPS host is required for the single-link solution. The existing `inkly-web-taupe.vercel.app` legal-link host is a candidate, but ownership and the ability to add invite/association routes must be confirmed before implementation.
- `src/features/home/HomeCameraSection.tsx` currently blocks the post-photo flow on a context text field, four mood chips, and a manual Generate button.
- `src/features/home/useHomeCamera.ts` already has the shared `generateForImage` path needed for automatic generation, but only calls it from the manual Generate action.
- `src/features/home/AiToolsRow.tsx` already exposes optional `calm`, `funny`, and `savage` rewrite actions with review/approve behavior.
- `supabase/functions/quote/index.ts` currently describes a user-entered feeling as the primary signal even when no feeling is supplied.

## Decisions

1. Keep the existing loading indicator and render it without adjacent text.
2. Keep the existing share icon, hit target, disabled state, and callback; remove only its label.
3. Generate one public HTTPS invite URL, `https://<confirmed-controlled-host>/invite/<code>`, and use it for both the share message and QR code.
4. Configure that host as an iOS Universal Link and Android App Link. When Inkly is installed, the URL must reach the existing `/invite/[code]` route.
5. When Inkly is not installed, the same HTTPS route must redirect to the exact App Store URL. The App Store URL is the fallback destination, not the invite URL itself.
6. Keep `inkly://invite/<code>` registered and parsable for backward compatibility, but do not generate or display it in new share payloads or QR codes.
7. Treat automatic post-install invite attribution as a separate capability. A plain App Store redirect cannot restore `<code>` after installation; deferred attribution requires a provider/backend or asking the user to reopen the HTTPS invite link after installing.
8. After capture or gallery selection, call the existing quote-generation path automatically with no user mood/context. The first quote should use the photo as the primary emotional signal and persona traits as voice guidance.
9. Remove the pre-generation context input and mood chips. If automatic generation fails or is blocked, retain only a retry action; do not bring back mood selection.
10. Keep the existing post-generation `AiToolsRow` rewrite actions as the optional mood change. Make its section label communicate that it rewrites the quote mood, while preserving the existing review/approve flow.
11. Keep the optional `momentContext` API field for backward compatibility, but the home capture flow should stop sending it. Update the quote prompt and contract documentation to describe automatic mood inference when it is absent.

## Acceptance Criteria

- Saving a generated quote displays only a centered loading icon in the save control; no `Saving memory…` text is visible in English or Vietnamese.
- Sharing a generated image displays the existing share icon without `Share image` text in English or Vietnamese.
- The Friends share sheet and QR code use the same recipient-specific HTTPS invite URL on the confirmed developer-controlled host.
- With Inkly installed, opening or scanning that HTTPS invite URL reaches the existing `/invite/[code]` route and preserves the invite code.
- Without Inkly installed, opening that same HTTPS invite URL redirects to the exact App Store URL:
  `https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001`.
- Older `inkly://invite/<code>` links remain parsable and routable for backward compatibility, but are not generated for new shares.
- The implementation documents that an immediate App Store redirect does not provide deferred invite attribution after install unless a separate provider/backend flow is added.
- Existing invite resolution, sign-in return routing, friend creation, and analytics behavior remain unchanged.
- Selecting or capturing a photo automatically starts quote generation without displaying a mood picker or asking for a feeling first.
- The generated quote uses the photo/persona path when no `momentContext` is supplied.
- After a quote appears, opening Edit & style exposes the existing Calm/Funny/Savage rewrite choices, and approval still uses the existing rewrite review flow.
- If automatic generation cannot produce a quote, the user sees a retry action rather than a mood-selection form.
