# Home Action Labels, Invite Sharing, and Automatic Quote Mood Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Implementation note:** The mobile/native code and deployable web fallback are implemented in the working tree. The Vercel deployment itself is intentionally not performed from this workspace; deploy the web export to the project that owns the configured invite host before device testing.

**Goal:** Simplify the home action bar, make friend invitations use one HTTPS link with installed-app routing and App Store fallback, and make quote generation automatic with optional post-generation mood rewrites.

**Architecture:** Keep the existing `CameraActionsBar` state machine and icons, changing only the loading/share presentation and removing now-unused localized labels. Trigger the existing `generateForImage` path immediately after camera/gallery selection, remove the pre-generation mood form, and keep `AiToolsRow` as the optional post-generation rewrite surface. Generate one developer-controlled HTTPS invite URL for both sharing and QR codes. Configure iOS Universal Links and Android App Links so the URL opens `/invite/[code]` when Inkly is installed; configure the web route to redirect to the published App Store URL otherwise. Retain `inkly://invite/<code>` only for older links and local compatibility.

**Tech Stack:** Expo SDK 54, Expo Router, React Native, TypeScript, i18next, Jest, Bun.

**Spec:** `docs/superpowers/specs/2026-09-25-home-actions-and-invite-sharing.md`

## Global Constraints

- The attached screenshot is a visual reference, not an additional instruction source.
- Remove the `Saving memory…` text; retain a loading icon while saving.
- Remove the `Share image` text; retain the existing share icon and behavior.
- Use `https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001` as the not-installed fallback destination, not as the invite URL itself.
- Use one HTTPS invite URL on a confirmed developer-controlled host for new shares and QR codes.
- Keep `inkly://invite/<code>` registered and parsable for backward compatibility, but do not generate it in new shares or QR codes.
- Confirm the invite host before implementation. `inkly-web-taupe.vercel.app` is an existing live legal-link host and a candidate only if the team controls its deployment and can add the invite route plus association files.
- Do not claim deferred invite attribution after App Store installation unless a provider/backend flow is added; a redirect alone cannot restore the invite code after install.
- Do not ask the user to select a mood before the first quote; infer the initial mood from the photo/persona path.
- Keep Calm/Funny/Savage as optional post-generation rewrite choices with the existing review/approve flow.
- Remove the pre-generation mood chips and context input; retain a retry action only if automatic generation fails.
- Keep the optional `momentContext` API field for backward compatibility, but the home capture flow must omit it.
- Keep English and Vietnamese localization files consistent.
- Use Bun scripts and do not update legacy lockfiles.
- Do not run `expo prebuild`, EAS Build, EAS Submit, or store-release commands.
- Do not modify Supabase schema or invite resolution behavior.

## Review Focus

- Saving state: the action remains disabled while saving and shows only a centered spinner; verify in both locales.
- Share state: the existing share icon remains visible, its disabled opacity still works, and no label remains.
- Public invite sharing: the message and QR code use the same recipient-specific HTTPS invite URL on the confirmed host.
- Installed invite sharing: that HTTPS URL resolves to `/invite/[code]`; the legacy custom scheme remains accepted but is not newly generated.
- Not-installed invite sharing: the same HTTPS URL falls back to the exact App Store URL.
- Association and fallback: iOS AASA, Android `assetlinks.json`, native association configuration, and the web invite route are all present and verified.
- Automatic generation: capture and gallery selection each start exactly one generation, with no mood form shown before the quote.
- Rewrite path: after the initial quote, Calm/Funny/Savage remain available and still require approval before replacing the quote.
- Generation failure: a blocked/failed automatic request leaves a retry affordance without restoring user mood selection.

## File Map

| File | Responsibility | Planned change |
|---|---|---|
| `src/components/CameraActionsBar.tsx` | Home save/share controls | Remove the saving and share labels while retaining spinner, icon, callbacks, and states. |
| `src/i18n/locales/en.json` | English copy | Remove the two unused camera labels and update the invite message placeholders. |
| `src/i18n/locales/vi.json` | Vietnamese copy | Remove the two unused camera labels and update the invite message placeholders. |
| `src/config/appLinks.ts` | App destinations | Create the single source of truth for the App Store fallback and confirmed invite web origin. |
| `src/services/inviteApi.ts` | Invite URL generation | Generate the public HTTPS invite URL while preserving Supabase code creation and legacy parsing. |
| `app/(tabs)/friends.tsx` | Invite share sheet | Use the same public HTTPS invite URL for the message/share payload and QR value. |
| `__tests__/invite.test.ts` | Invite URL regression coverage | Test the App Store fallback, public HTTPS invite construction, and legacy custom/HTTPS parsing. |
| `app.json` / `app.config.ts` | Expo native linking config | Add the confirmed host to iOS Associated Domains and Android verified HTTPS intent filters. |
| `ios/InklyDailyVibes/InklyDailyVibes.entitlements` | iOS association entitlement | Add `com.apple.developer.associated-domains` for the confirmed host if checked-in native configuration is required. |
| `android/app/src/main/AndroidManifest.xml` | Android association config | Ensure the checked-in activity has the confirmed HTTPS host/path and `android:autoVerify`. |
| `public/invite.html` and `vercel.json` | Static web fallback | Redirect browser visits for `/invite/<code>` to the App Store; Vercel rewrites the dynamic path to the static fallback. |
| `public/.well-known/apple-app-site-association` | iOS association file | Associate `/invite/*` with Team ID `6SXWS6JV43` and bundle ID `com.dustindoan.inkly`. |
| `public/.well-known/assetlinks.json` | Android association file | Associate the app package with local/EAS signing fingerprints; add a Play App Signing fingerprint if it differs. |
| `web invite host` (external deployment) | HTTPS fallback and association files | Deploy this repository’s web export to the Vercel project that owns the configured host. |
| `src/features/home/useHomeCamera.ts` | Photo-to-quote state machine | Auto-generate after camera/gallery selection, remove home mood context state, and retain a retry handler. |
| `src/features/home/HomeCameraSection.tsx` | Capture and editing UI | Remove the pre-generation mood/context form and keep a retry-only empty-quote state; keep Edit & style rewrites. |
| `app/(tabs)/index.tsx` | Home route wiring | Stop passing the removed mood/context props and wire the retry handler. |
| `src/i18n/locales/en.json` | English generation/rewrite copy | Replace pre-generation mood copy and make the rewrite section explicit. |
| `src/i18n/locales/vi.json` | Vietnamese generation/rewrite copy | Replace pre-generation mood copy and make the rewrite section explicit. |
| `supabase/functions/quote/index.ts` | Initial quote prompt | Make photo-based mood inference the default when no user feeling is supplied. |
| `docs/ai-api-contract.md` | AI contract documentation | Document automatic mood inference and the retained optional context field. |
| `__tests__/aiClient.test.ts` | AI request regression coverage | Verify generation without context omits `momentContext` while legacy context forwarding remains covered. |

Native deep-link files are intentionally unchanged in the initial implementation because `app.json`, iOS `Info.plist`, and Android `AndroidManifest.xml` already declare the `inkly` scheme. They should be checked during verification rather than edited speculatively.

---

### Task 1: Simplify the home action bar labels

**Files:**
- Modify: `src/components/CameraActionsBar.tsx:1-119`
- Modify: `src/i18n/locales/en.json:20-30`
- Modify: `src/i18n/locales/vi.json:19-29`
- Test: simulator/dev-build visual verification plus lint

**Interfaces:**
- Consumes: existing `isSaving`, `canSave`, `canShare`, `onSave`, and `onShare` props.
- Produces: unchanged `CameraActionsBarProps`; no caller changes are required.

- [ ] **Step 1: Confirm the current state behavior before editing.**

  Read the save branch at `src/components/CameraActionsBar.tsx:50-71` and the share branch at `src/components/CameraActionsBar.tsx:90-104`. Preserve the existing `disabled` expressions and opacity rules exactly:

  ```tsx
  disabled={!canSave || isSaving}
  disabled={!canShare}
  ```

- [ ] **Step 2: Remove only the saving label.**

  Keep the save button size, border, disabled behavior, and `ActivityIndicator`, but replace the saving-state row with a centered icon-only layout:

  ```tsx
  {isSaving ? (
    <View className="w-full items-center justify-center">
      <ActivityIndicator size="small" color="#ffffff" />
    </View>
  ) : (
    <Text className="text-center text-sm font-semibold text-white">
      {t("camera.saveButton")}
    </Text>
  )}
  ```

- [ ] **Step 3: Remove only the share label.**

  Keep the existing `share-outline` icon, `Pressable`, hit target, callback, and disabled opacity. The share content should become icon-only:

  ```tsx
  <Pressable
    onPress={onShare}
    disabled={!canShare}
    className="w-20 items-center justify-center rounded-2xl bg-black/45 px-2 py-2"
    style={({ pressed }) => ({
      opacity: !canShare ? 0.45 : pressed ? 0.8 : 1,
    })}>
    <Ionicons name="share-outline" size={21} color="#ffffff" />
  </Pressable>
  ```

- [ ] **Step 4: Remove dead camera labels from both locales.**

  Delete only these keys from `camera` in both translation files:

  ```json
  "savingButton": "...",
  "shareImageButton": "..."
  ```

  Keep `camera.saveButton`, because it is still rendered when the image is not saving.

- [ ] **Step 5: Run the focused static checks.**

  Run:

  ```bash
  bun run lint -- --no-warn-ignored src/components/CameraActionsBar.tsx
  bun run test -- --runInBand
  ```

  Expected: lint passes, the existing Jest suite passes, and no source reference to `camera.savingButton` or `camera.shareImageButton` remains.

- [ ] **Step 6: Commit the isolated UI change.**

  ```bash
  git add src/components/CameraActionsBar.tsx src/i18n/locales/en.json src/i18n/locales/vi.json
  git commit -m "ui: simplify home save and share actions"
  ```

---

### Task 2: Define one public HTTPS invite URL

**Files:**
- Create: `src/config/appLinks.ts`
- Modify: `src/services/inviteApi.ts:1-100`
- Modify: `app/(tabs)/friends.tsx:1-82`
- Modify: `src/i18n/locales/en.json:378-398`
- Modify: `src/i18n/locales/vi.json:379-399`
- Test: `__tests__/invite.test.ts`

**Interfaces:**
- Consumes: `getOrCreateMyInvite(userId)` and the existing Supabase invite code contract.
- Produces: `APP_STORE_URL`, a confirmed `INVITE_WEB_ORIGIN`, and a public `https://<origin>/invite/<code>` value returned through the existing invite data shape.

**External prerequisite:** Before implementation, confirm that the team controls the HTTPS host used for invites. `https://inkly-web-taupe.vercel.app` is a candidate because it is already live for legal links, but it must not be used unless the team can deploy its invite route and association files. If it is not controlled, provide a controlled domain before starting the native association work.

- [ ] **Step 1: Add the App Store fallback and confirmed invite origin.**

  Create `src/config/appLinks.ts`:

  ```ts
  export const APP_STORE_URL =
    "https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001" as const;

  export const INVITE_WEB_ORIGIN = "https://<confirmed-controlled-host>" as const;

  export function buildPublicInviteUrl(code: string): string {
    return `${INVITE_WEB_ORIGIN}/invite/${encodeURIComponent(code)}`;
  }
  ```

  Replace the host placeholder with the confirmed production origin before committing. Do not use `apps.apple.com` as `INVITE_WEB_ORIGIN`.

  Create or update `__tests__/invite.test.ts` with pure, dependency-light coverage:

  ```ts
  import {
    APP_STORE_URL,
    buildPublicInviteUrl,
  } from "@/config/appLinks";
  import { parseInviteCode } from "@/utils/invite";

  describe("invite links", () => {
    it("uses the published App Store URL", () => {
      expect(APP_STORE_URL).toBe(
        "https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001",
      );
    });

    it("builds one public HTTPS invite URL", () => {
      expect(buildPublicInviteUrl("abc12345")).toMatch(
        /^https:\/\/[^/]+\/invite\/abc12345$/,
      );
    });

    it("keeps parsing installed-app invite links", () => {
      expect(parseInviteCode("inkly://invite/abc12345")).toBe("abc12345");
    });

    it("keeps parsing HTTPS invite paths", () => {
      expect(parseInviteCode("https://example.com/invite/abc12345")).toBe(
        "abc12345",
      );
    });
  });
  ```

- [ ] **Step 2: Make invite creation return the public HTTPS URL.**

  In `src/services/inviteApi.ts`, keep the existing Supabase row creation and code validation, but replace the generated `inkly://invite/<code>` value with `buildPublicInviteUrl(code)`. Keep the return shape stable so Friends, QR rendering, and analytics do not need a data-contract migration.

  Keep `parseInviteCode` accepting both the new HTTPS path and legacy `inkly://invite/<code>` values. The parser should not silently accept arbitrary non-invite paths as a new share format.

- [ ] **Step 3: Make Friends and QR use the same public invite URL.**

  In `app/(tabs)/friends.tsx`, keep `inviteUrl` backed by `inviteData?.url`. Update `handleInviteShare` so the share payload and message use that same HTTPS URL:

  ```tsx
  const result = await Share.share({
    message: t("friends.inviteMessage", {
      appName: APP_DISPLAY_NAME,
      url: inviteUrl,
    }),
    url: inviteUrl,
    title: t("friends.inviteSectionTitle"),
  });
  ```

  Keep the existing `inviteUrl` guard, loading state, analytics event, auto-share behavior, and `/invite/[code]` route unchanged. Set the QR value to the same `inviteUrl`; do not generate a second QR value.

- [ ] **Step 4: Update invite message translations in English and Vietnamese.**

  Change the existing `friends.inviteMessage` strings to contain only the one public URL. The exact wording can follow the locale’s existing tone, but both locales must communicate that the link opens Inkly or sends the recipient to the App Store:

  ```text
  Join me on Inkly! Open this link to accept my invite: {{url}}
  ```

  Use `{{url}}` for the user-specific public HTTPS invite URL. The web route, not the message copy, owns the installed-app versus App Store fallback decision.

- [ ] **Step 5: Run invite-focused tests and lint.**

  Run:

  ```bash
  bun run test -- --runInBand __tests__/invite.test.ts
  bun run lint -- --no-warn-ignored 'app/(tabs)/friends.tsx' src/config/appLinks.ts src/utils/invite.ts
  ```

  Expected: all invite tests pass, the generated URL is HTTPS, `parseInviteCode` still accepts both new HTTPS and legacy custom-scheme paths, and Friends has no type/lint errors.

- [ ] **Step 6: Commit the invite URL contract change.**

  ```bash
  git add src/config/appLinks.ts src/services/inviteApi.ts app/(tabs)/friends.tsx src/i18n/locales/en.json src/i18n/locales/vi.json __tests__/invite.test.ts
  git commit -m "fix: use one public HTTPS invite URL"
  ```

---

### Task 3: Configure Universal Links, App Links, and the web fallback

**Files / systems:**
- Modify: `app.json` or `app.config.ts`
- Modify: `ios/InklyDailyVibes/InklyDailyVibes.entitlements` if checked-in native entitlements are authoritative
- Modify: `android/app/src/main/AndroidManifest.xml` if checked-in native configuration is authoritative
- Modify: the confirmed invite web host (external to this repository unless its source is added here)
- Test: native association validation and installed/not-installed routing

**Interfaces:**
- Consumes: `INVITE_WEB_ORIGIN`, `APP_STORE_URL`, and the existing Expo Router route `app/invite/[code].tsx`.
- Produces: one HTTPS invite URL that opens `/invite/[code]` when installed and redirects to the App Store when not installed.

- [ ] **Step 0: Reproduce the legacy custom-scheme behavior on a standalone build.**

  Test `inkly://invite/<real-code>` on an installed development/release build, not Expo Go. Record which layer fails: the link is not recognized by the messaging/QR surface, the OS does not launch Inkly, Inkly launches but does not receive the URL, or the invite route rejects the code. The repository already has the route and custom-scheme declarations, so this check distinguishes a transport/fallback problem from a runtime URL-forwarding problem before the HTTPS migration.

- [ ] **Step 1: Add iOS Universal Link association.**

  Add `ios.associatedDomains: ["applinks:<confirmed-host>"]` to the Expo config and ensure the checked-in entitlements contain the same host if this repository’s native projects are committed manually. Publish `/.well-known/apple-app-site-association` on the host with the production Team ID and bundle ID `com.dustindoan.inkly`, limited to `/invite/*`.

  Do not use `apps.apple.com` in `associatedDomains`; Apple’s App Store host is not controlled by Inkly.

- [ ] **Step 2: Add Android App Link association.**

  Add an HTTPS `VIEW`/`DEFAULT`/`BROWSABLE` intent filter for the confirmed host and `/invite` path with `android:autoVerify="true"`. Publish `/.well-known/assetlinks.json` containing package `com.dustindoan.inkly` and the SHA-256 fingerprint for the actual release signing certificate. The signing fingerprint must be read from the real release/Play App Signing configuration; do not invent one.

- [ ] **Step 3: Add the web invite fallback route.**

  On the confirmed host, serve `/invite/<code>` and preserve the code in the URL. If the OS does not hand the URL to Inkly, redirect to:

  ```text
  https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001
  ```

  The route may optionally render a short landing page before redirecting, but it must not replace the invite code with a generic App Store URL for installed-app routing.

- [ ] **Step 4: Decide deferred attribution explicitly.**

  Document one of these supported behaviors:

  1. Baseline: after installing from the App Store, the recipient reopens the original HTTPS invite link to complete acceptance; or
  2. Deferred attribution: add a dedicated provider/backend flow that stores and restores the invite code across installation.

  Do not claim that query parameters on the Apple App Store URL will automatically restore the invite code after installation.

- [ ] **Step 5: Verify the association files before building.**

  Fetch the exact production URLs and validate their JSON and identifiers:

  ```bash
  curl -fsS "https://<confirmed-host>/.well-known/apple-app-site-association"
  curl -fsS "https://<confirmed-host>/.well-known/assetlinks.json"
  ```

  Confirm the web route returns the expected redirect and that no authentication, HTML wrapper, or unexpected redirect blocks the association files.

- [ ] **Step 6: Commit the native/web association change separately.**

  Keep native association changes separate from the UI and AI work so signing or host configuration problems can be diagnosed independently.

---

### Task 4: Generate the first quote automatically and make mood rewriting optional

**Files:**
- Modify: `src/features/home/useHomeCamera.ts:88-365,501-590`
- Modify: `src/features/home/HomeCameraSection.tsx:50-156,701-748,848-876`
- Modify: `app/(tabs)/index.tsx:80-115,323-381`
- Modify: `src/i18n/locales/en.json:96-135,412-449`
- Modify: `src/i18n/locales/vi.json:95-134,410-448`
- Modify: `supabase/functions/quote/index.ts:36-70`
- Modify: `docs/ai-api-contract.md:10-36`
- Modify: `__tests__/aiClient.test.ts:55-88`
- Test: focused AI client test, Deno quote contract test if available, and simulator flow

**Interfaces:**
- Consumes: the existing `generateForImage(sourceUri, enforceCooldown, sourceBase64?)` path, `useGenerateQuote.generate`, and `useHomeAiReview` rewrite actions.
- Produces: camera/gallery selection automatically starts one initial quote generation; `onRetryGeneration()` remains available only for a failed/blocked initial request; `AiToolsRow` remains the optional post-generation mood rewrite surface.

- [ ] **Step 1: Pin the no-context client contract.**

  Add this test to `__tests__/aiClient.test.ts` without removing the existing legacy-context test:

  ```ts
  it("omits momentContext when the home flow generates from the photo alone", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "The light found you before you found the words." }),
    });

    await generateQuote({
      personaId: "guest",
      personaTraits: ["curious", "optimistic"],
      language: "en",
    });

    const [, request] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(request.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty("momentContext");
  });
  ```

- [ ] **Step 2: Make the camera hook auto-generate after capture and gallery selection.**

  In `src/features/home/useHomeCamera.ts`:

  1. Remove `momentContext` state, its reset calls, and `setMomentContext` from the returned hook contract.
  2. Keep `generateForImage` as the single generation path, but call `generate(base64, enforceCooldown)` without passing a context value.
  3. After a successful camera capture sets `photo.uri`, call `void generateForImage(photo.uri, true)`.
  4. After a successful gallery pick sets `picked.uri`, call `void generateForImage(picked.uri, true)`.
  5. Keep `handleGenerateAI` as the retry handler for a selected image that has no quote; rename it to `handleRetryGeneration` if that makes the public contract clearer.
  6. Do not add a second generation effect keyed to `selectedImageUri`; direct calls from the two selection handlers prevent duplicate requests.

  The resulting camera/gallery shape should be equivalent to:

  ```ts
  setSelectedImageUri(photo.uri);
  setSelectedImageBase64(null);
  clearDailyQuote();
  setHideQuote(true);
  setHasSavedCurrentPhoto(false);
  void generateForImage(photo.uri, true);
  ```

  Preserve the existing quota guard, cooldown guard, progress stages, error toast, and quote store behavior.

- [ ] **Step 3: Remove the pre-generation mood/context form.**

  In `HomeCameraSectionProps` and `app/(tabs)/index.tsx`, remove:

  ```ts
  momentContext: string;
  onMomentContextChange: (value: string) => void;
  onGenerateReflection: () => void;
  ```

  Replace the current `selectedImageUri && !dailyQuoteText && !isGenerating` panel with a retry-only state that is hidden while `isGenerating` or `generationProgress > 0`. It must contain no text input and no mood chips. Use copy equivalent to:

  ```tsx
  {selectedImageUri &&
  !dailyQuoteText &&
  !isGenerating &&
  generationProgress === 0 ? (
    <View className="absolute inset-x-0 bottom-0 z-[8] border-t border-white/15 bg-black/80 px-4 pb-4 pt-3">
      <Text className="text-sm font-semibold text-white">
        {t("home.captureFlow.retryTitle")}
      </Text>
      <Text className="mt-1 text-xs leading-4 text-white/75">
        {t("home.captureFlow.retrySubtitle")}
      </Text>
      <Pressable
        onPress={onRetryGeneration}
        className="mt-3 items-center rounded-xl bg-white px-4 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}>
        <Text className="text-sm font-bold text-black">
          {t("home.captureFlow.retry")}
        </Text>
      </Pressable>
    </View>
  ) : null}
  ```

- [ ] **Step 4: Keep mood choice after generation through the existing rewrite tools.**

  Keep `AiToolsRow` and the existing `calm`, `funny`, and `savage` buttons unchanged functionally. Update only the section label in both locales so users understand these are optional rewrites, for example:

  ```json
  "aiTools": {
    "title": "Rewrite mood"
  }
  ```

  Vietnamese should use the equivalent localized meaning. The existing `handleRewriteQuote`, pending rewrite preview, validation, Cancel, and Use rewrite actions remain the only path for replacing the generated quote with another mood.

- [ ] **Step 5: Update copy and remove stale pre-generation mood keys.**

  In `home.captureFlow` in both locales:

  - Delete `contextTitle`, `contextSubtitle`, `contextPlaceholder`, `moods`, and `generate`.
  - Add localized `retryTitle`, `retrySubtitle`, and `retry` copy for a failed/blocked automatic generation.
  - Keep `editAndStyle` and `hideEditing` for the visual style/rewrite panel.

  Update onboarding copy that promises the user will add a feeling, such as `onboarding.welcome.subheadline` and `onboarding.howItWorks.save.subtitle/line1`, to explain that Inkly finds the first vibe automatically and the user can edit or rewrite it afterward.

- [ ] **Step 6: Update the backend prompt and contract documentation.**

  In `supabase/functions/quote/index.ts`, change the system prompt and input framing to use this rule:

  ```text
  If the user provides a stated feeling, honor it. When no stated feeling is provided, infer a fitting emotional mood from the photo and persona traits. Use the photo as the primary content signal and persona traits only to shape voice.
  ```

  The English prompt should follow this shape:

  ```ts
  `Write one personal, emotionally precise quote in English for a photo journal.

  If the user provides a stated feeling, honor it. When no stated feeling is provided, infer a fitting emotional mood from the photo and persona traits. Use the photo as the primary content signal; use persona traits only to shape voice.

  Return one natural complete sentence of at most 180 characters. Do not describe the image literally or mention a photo, camera, or scene. Avoid slogans, clichés, generic advice, profanity, and quotation marks.`
  ```

  The Vietnamese prompt should express the same priority in Vietnamese. Update `buildInput` so the field is labeled as optional rather than authoritative when absent:

  ```ts
  text: `User's stated feeling (optional): ${momentContext || "none"}
  Persona traits (voice only): ${traitsDescription}
  ${retryInstruction}`
  ```

  Keep `momentContext` optional and accepted for backward compatibility; this task changes the home client default, not the request schema. Update `docs/ai-api-contract.md` to state that omitted `momentContext` means the service infers the initial mood from the photo/persona, and that `/quote-rewrite` is the optional post-generation tone change.

- [ ] **Step 7: Run focused tests and lint.**

  ```bash
  bun run test -- --runInBand __tests__/aiClient.test.ts
  bun run lint -- --no-warn-ignored src/features/home/useHomeCamera.ts src/features/home/HomeCameraSection.tsx 'app/(tabs)/index.tsx'
  ```

  If the Supabase Deno test runner is configured locally, also run the quote function tests. Expected: the no-context request omits `momentContext`, the legacy forwarding test still passes, and no removed capture-flow key is referenced in app source.

- [ ] **Step 8: Commit the automatic-generation change.**

  ```bash
  git add src/features/home/useHomeCamera.ts src/features/home/HomeCameraSection.tsx 'app/(tabs)/index.tsx' src/i18n/locales/en.json src/i18n/locales/vi.json supabase/functions/quote/index.ts docs/ai-api-contract.md __tests__/aiClient.test.ts
  git commit -m "feat: generate quote mood automatically"
  ```

---

### Task 5: Verify the end-to-end behavior on the Expo app

**Files:**
- Modify: none
- Test: iOS development build, Android development build when available, full lint, full Jest suite

**Interfaces:**
- Consumes: the completed UI and invite-share changes from Tasks 1 and 2.
- Consumes: the automatic-generation and optional-rewrite changes from Task 3.
- Produces: verified behavior and a clean implementation handoff.

- [ ] **Step 1: Run the full static and unit checks.**

  ```bash
  bun run lint
  bun run test -- --runInBand
  ```

  Expected: both commands pass with no stale camera label references.

- [ ] **Step 2: Start the supported local Expo loop.**

  ```bash
  ./script/build_and_run.sh --ios
  ```

  If a development build is required by the current project state, use the script’s supported dev-client path; do not run `expo prebuild` or a store build.

- [ ] **Step 3: Verify the home action states.**

  1. Create or select an image and generate a quote.
  2. Tap save and confirm the save control shows only the centered spinner while disabled.
  3. After saving completes, confirm the save label still appears when idle.
  4. Confirm the share control shows the existing share icon only, remains disabled until a shareable quote image exists, and still opens the image share sheet when enabled.
  5. Repeat the visible checks with Vietnamese selected.

- [ ] **Step 4: Verify automatic mood generation and optional rewrites.**

  1. Capture a photo and confirm generation starts immediately; no mood input, mood chips, or manual first-generation screen appears.
  2. Choose a photo from the gallery and confirm it follows the same automatic-generation path.
  3. After the first quote appears, open Edit & style and confirm the visual Size/Color controls remain available.
  4. Confirm the rewrite section is clearly labeled as a mood rewrite and offers Calm, Funny, and Savage.
  5. Choose another mood, confirm a preview appears, and verify Cancel leaves the original quote unchanged while Use rewrite replaces it.
  6. Force or simulate a generation failure/limit and confirm the UI offers retry without restoring the mood picker.

- [ ] **Step 5: Verify invite sharing and deep links.**

  1. Sign in and open Friends.
  2. Tap Invite/Share and confirm the message and QR value contain the same public HTTPS invite URL on the confirmed host.
  3. On a device with Inkly installed, open that HTTPS invite link and confirm it reaches `/invite/[code]`, resolves the inviter, and returns to Friends after acceptance.
  4. Scan the displayed QR code and confirm it routes through the same HTTPS invite flow.
  5. On a device without Inkly installed, open that same HTTPS invite URL and confirm the web fallback redirects to the published Inkly listing.
  6. If deferred attribution was not implemented, confirm the invite is completed by reopening the original HTTPS URL after installation; do not treat the App Store redirect alone as proof of code preservation.

- [ ] **Step 6: Review the diff for scope and native safety.**

  ```bash
  git diff --check
  git status --short
  git diff --stat HEAD~2..HEAD
  ```

  Expected: only the planned UI, locale, app-link, automatic-generation, AI prompt/documentation, test, and plan/spec files changed; no native project regeneration or lockfile churn appears.

## Self-Review

- Spec coverage: Task 1 covers both screenshot label removals; Task 2 covers the single HTTPS invite URL; Task 3 covers Universal/App Links and the App Store fallback; Task 4 covers automatic mood generation, removal of the pre-generation picker, optional rewrites, and prompt/contract behavior; Task 5 covers end-to-end routing and UI behavior.
- Prerequisite scan: the only unresolved input is the developer-controlled invite host and its production signing identifiers; implementation must confirm these before native association files are published.
- Type consistency: `APP_STORE_URL` and the confirmed invite origin are string constants; `inviteUrl` remains the existing `string | null`; the translation call supplies one `url` placeholder; the home camera retry handler accepts no arguments and reuses the existing generation path.
- Review focus coverage: saving and share states are checked in Task 5 Step 3; automatic generation and rewrite approval are checked in Task 5 Step 4; public, installed, and fallback invite paths are checked in Task 5 Step 5; association files are checked in Task 3 and QR parsing is pinned by Task 2 tests.
