# Guest photos into a returning account

Returning Apple/Google login must preserve guest memories by merging them into the verified destination account, then deleting the anonymous source only after successful transfer. Same-identity upgrades retain their UUID and require no deletion.

The client saves the source session proof in the existing secure auth storage before replacing it, binds the successful destination identity, and retries pending transfers after login or Memories refresh. It remaps the local cache only after the server confirms completion. Refreshing an expired source token uses an isolated client, preserving the destination session.

The server verifies both identities, allows anonymous sources only, and claims a durable source-to-target receipt. A service-role-only lease serializes retries and blocks guest writes after claim. Copies use deterministic target-owned paths; guarded record updates preserve photo IDs and presentation metadata. Cleanup and source deletion run only after every referenced object and row is transferred. Retries after deletion use the destination-bound receipt.

Validation includes forged/source/destination identity rejection, different-target conflicts, pagination, failed copy/update/delete recovery, duplicate retries, offline client persistence and no local relabeling before server success. Deployment requires the new migration and Edge Function. No iOS build is required.

Existing photos from an already-lost guest session cannot be claimed by a guest ID alone. Recovery requires a still-valid saved guest credential or trusted administrative verification.

## Deployment and verification

Deployed to project `nwaqdinhdtqqdcjcpxnq`: migrations `20261003110926_merge_guest_account` and `20261003111107_harden_guest_merge_function_permissions`, Edge Function `merge-guest-account` version 1. The function disables gateway JWT verification and validates both sessions through Auth server-side; unauthenticated POST was verified to return 401.

A rolled-back live SQL test verified claims, different-target conflict, ownership transfer with preserved quote/favorite/transform, and cleanup checks. API roles cannot invoke transfer/claim or read receipts. Trigger functions were explicitly revoked from API roles after checking default grants. The authenticated Storage policy status helper intentionally remains callable. Nine isolated Deno handler tests passed.

For existing photos whose anonymous credentials were lost before this fix, the DEV-only profile button copies non-secret account IDs and available guest photo IDs for trusted one-time recovery. IDs alone never authorize the public merge endpoint.
