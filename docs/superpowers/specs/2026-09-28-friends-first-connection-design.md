# Friends First-Connection Design

**Date:** 2026-09-28  
**Status:** Draft for user review

## User Goal

Prioritize Friends ahead of the planned iOS widget and make the first friend connection feel useful to a new Inkly user. The chosen direction is to make inviting or scanning the clearest next step, then explain how friend-visible quote moments can be found in the existing Home feed and Memories.

## Current Experience

- Guests who open Friends see a sign-in prompt. Signing in returns them to Friends with `autoShare=1`, which opens the system share sheet when the invite URL is ready.
- Signed-in users see a share-link action, QR scanner, their own invite QR, and a friend list. An empty list shows an invite prompt.
- Invite links resolve through `app/invite/[code].tsx`; accepting one creates reciprocal rows in `friends` and returns to Friends after a short delay.
- Home's quote-photo feed includes the signed-in user's photos and their friends' photos permitted by Supabase row-level security. Memories has a Friends layer, and users can change a saved quote photo's visibility between private and friends.
- `listMyFriends` currently returns an empty list for database errors. `getOrCreateMyInvite` can return `null` without exposing the cause, so a failed load can look like a true empty state or leave invite actions unavailable.

## Approved Direction

Improve the existing first-connection path rather than introducing another social subsystem:

1. Explain the payoff in the guest and no-friends states: friends can share quote moments that appear in Home and Memories when they choose Friends visibility.
2. Keep one prominent **Invite a friend** action. Keep QR scanning and showing the user's own QR available as secondary ways to connect.
3. After an invite is accepted, show a clear success state with an explicit **View Friends** action. Do not rely on a short auto-dismiss timer.
4. Distinguish a genuinely empty friend list from a failed load. Provide a retry path, and show a clear invite-loading error rather than silently disabling the invite actions.
5. Preserve the existing sign-in return path, bilateral friend relationship, feed, Memories, and privacy rules. Existing friends retain the list and remove action.

## Flow and Data

### Guest starts from Friends

Show the social value before the sign-in request. Sign-in retains the Friends return route and current invite-sharing continuation. If invite creation fails after returning, explain the error and offer retry.

### Signed-in user has no friends

Load the invite link and friend list. Show the invitation as the primary action, with QR scan and the user's QR as secondary controls. A confirmed empty list shows the empty state; failed friend or invite queries show a recoverable error state instead.

### Friend accepts an invite

Resolve the code and create the existing reciprocal relationship. Show a persistent success message and a **View Friends** action. Returning to Friends reloads the relationship. The success copy explains where friend-visible quote moments appear and that visibility remains user-controlled.

### Existing friends

Keep the current profile rows, count, removal behavior, and invite controls. Friend quote photos continue to come from the current secured feed and Memories queries; no content is shared automatically.

## Privacy, Accessibility, and Localization

- Keep friendship limited to users who accept an invite or scan a valid invite QR.
- Do not change Supabase RLS or allow private quote photos into a friends feed.
- Do not access contacts or add chat, reactions, or notifications in this stage.
- Keep all text and actions available without animation, expose accessible labels for controls, and localize new or changed copy in English and Vietnamese.

## Scope Boundaries

- No new database tables, migrations, invite types, or friend request model.
- No changes to quote creation, photo saving, or default visibility.
- No new analytics events or dependencies.
- Defer the iOS widget until after the Friends-first connection work.

## Acceptance Criteria

- A guest can understand why adding a friend is useful before being asked to sign in, and returns to the existing invite path after sign-in.
- A signed-in user with no friends sees one obvious invite action and can still connect using either QR path.
- Invite acceptance has an explicit success state and does not disappear before the user can continue.
- A real empty state is distinguishable from a friend-list or invite-load failure; each failure offers a retry.
- Existing friend rows and reciprocal relationship behavior remain intact.
- Home and Memories only show friend quote photos allowed by the existing visibility policy; private content stays private.
- New and changed copy is present in English and Vietnamese, with accessible controls.

## Implementation File Map

| File | Responsibility | Intended change |
|---|---|---|
| `app/(tabs)/friends.tsx` | Guest, empty, loaded, and error states | Clarify social payoff, emphasize invite, and add recoverable loading errors. |
| `app/invite/[code].tsx` | Invite acceptance result | Replace timed success redirect with an explicit route back to Friends and refresh the relationship. |
| `src/services/inviteApi.ts` | Invite/friend query outcomes | Preserve query failures so UI can distinguish errors from empty data. |
| `src/features/quotes/useQuotePhotoFeed.ts` | Home friend feed | Continue using existing error handling for friend-list failures; no feed contract change. |
| `src/features/memories/useFriendsMemoriesForDay.ts` | Friends Memories | Continue using existing error handling for friend-list failures. |
| `src/i18n/locales/en.json` | English copy | Add first-connection, success, retry, and error copy. |
| `src/i18n/locales/vi.json` | Vietnamese copy | Mirror the English updates. |

## Review Questions

- Does the first-connection emphasis and its post-acceptance payoff match the intended Friends priority?
- Is the scope limited enough for one implementation plan?
