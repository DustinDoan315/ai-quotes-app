import { adminClient } from "../_shared/admin.ts";

type DeleteAccountRequest = {
  confirmation?: unknown;
};

type PhotoRow = {
  id: string;
  storage_path: string;
};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};
const STORAGE_BATCH_SIZE = 100;
const USER_PHOTOS_BUCKET = "user-photos";
const USER_AVATARS_BUCKET = "user-avatars";

const response = (
  status: number,
  payload: { deleted: true } | { error: { code: string; message: string } },
): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const errorResponse = (status: number, code: string, message: string): Response =>
  response(status, { error: { code, message } });

const isOwnedStoragePath = (value: unknown, userId: string): value is string => {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) {
    return false;
  }

  const segments = value.split("/");
  return (
    segments.length >= 2 &&
    segments[0] === userId &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
  );
};

const removeStorageObjects = async (
  bucket: string,
  paths: readonly string[],
): Promise<{ error: Error | null }> => {
  for (let index = 0; index < paths.length; index += STORAGE_BATCH_SIZE) {
    const batch = paths.slice(index, index + STORAGE_BATCH_SIZE);
    const { error } = await adminClient.storage.from(bucket).remove(batch);
    if (error) return { error: new Error(error.message) };
  }

  return { error: null };
};

/**
 * The current upload clients store files directly under `<user id>/`. Listing
 * the folder also removes abandoned uploads and old avatar revisions that are
 * no longer referenced by the profile row.
 */
const listOwnedStoragePaths = async (
  bucket: string,
  userId: string,
): Promise<{ paths: string[]; error: Error | null }> => {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await adminClient.storage.from(bucket).list(userId, {
      limit: STORAGE_BATCH_SIZE,
      offset,
    });
    if (error) return { paths: [], error: new Error(error.message) };

    const page = data ?? [];
    for (const object of page) {
      const path = `${userId}/${object.name}`;
      if (!isOwnedStoragePath(path, userId)) {
        return {
          paths: [],
          error: new Error(`Unexpected object path in ${bucket}.`),
        };
      }
      paths.push(path);
    }

    if (page.length < STORAGE_BATCH_SIZE) break;
    offset += page.length;
  }

  return { paths, error: null };
};

const deleteAppRecords = async (
  userId: string,
  ownedPhotoIds: readonly string[],
): Promise<{ error: Error | null }> => {
  // A photo can have messages and reactions from other accounts. Delete those
  // first so the user photo delete cannot be blocked by its foreign keys.
  const photoDependentDeletes = [
    adminClient.from("user_photo_reactions").delete().eq("reactor_user_id", userId),
    adminClient.from("user_photo_messages").delete().eq("sender_user_id", userId),
  ];
  if (ownedPhotoIds.length > 0) {
    photoDependentDeletes.push(
      adminClient.from("user_photo_reactions").delete().in("photo_id", ownedPhotoIds),
      adminClient.from("user_photo_messages").delete().in("photo_id", ownedPhotoIds),
    );
  }

  const photoDependentResults = await Promise.all(photoDependentDeletes);
  const photoDependentFailure = photoDependentResults.find((result) => result.error);
  if (photoDependentFailure?.error) {
    return { error: new Error(photoDependentFailure.error.message) };
  }

  const deletions = [
    adminClient.from("user_photos").delete().eq("user_id", userId),
    adminClient.from("friends").delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    adminClient.from("invite_links").delete().eq("user_id", userId),
    adminClient.from("ai_usage_daily").delete().eq("user_id", userId),
    adminClient.from("user_subscriptions").delete().eq("user_id", userId),
    adminClient.from("user_profiles").delete().eq("user_id", userId),
  ];

  // Run the independent deletes together, but stop before deleting Auth if any fails.
  const results = await Promise.all(deletions);
  const failed = results.find((result) => result.error);
  return failed?.error ? { error: new Error(failed.error.message) } : { error: null };
};

Deno.serve(async (req: Request) => {
  // Native `functions.invoke` requests do not need CORS. Intentionally emit no
  // Access-Control-Allow-Origin header so this destructive endpoint is not web-callable.
  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Use POST for account deletion.");
  }

  const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return errorResponse(401, "unauthenticated", "An authenticated session is required.");
  }

  const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
  const user = authData.user;
  if (authError || !user) {
    return errorResponse(401, "unauthenticated", "Your session is no longer valid.");
  }

  if (user.is_anonymous) {
    return errorResponse(403, "anonymous_account", "Create an account before requesting deletion.");
  }

  let body: DeleteAccountRequest;
  try {
    body = (await req.json()) as DeleteAccountRequest;
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be valid JSON.");
  }

  if (body?.confirmation !== "DELETE") {
    return errorResponse(400, "confirmation_required", 'Set confirmation to "DELETE".');
  }

  // The user id comes exclusively from the verified JWT, never from request JSON.
  const userId = user.id;

  try {
    const [{ data: photos, error: photosError }, userPhotoObjects, userAvatarObjects] =
      await Promise.all([
        adminClient.from("user_photos").select("id, storage_path").eq("user_id", userId),
        listOwnedStoragePaths(USER_PHOTOS_BUCKET, userId),
        listOwnedStoragePaths(USER_AVATARS_BUCKET, userId),
      ]);

    if (photosError || userPhotoObjects.error || userAvatarObjects.error) {
      console.error("[delete-account] unable to load account data", {
        photosError,
        userPhotoObjectsError: userPhotoObjects.error,
        userAvatarObjectsError: userAvatarObjects.error,
      });
      return errorResponse(500, "cleanup_failed", "Could not prepare account deletion. Please try again.");
    }

    const ownedPhotos = (photos ?? []) as PhotoRow[];
    const photoPaths = [...new Set([
      ...ownedPhotos.map((photo) => photo.storage_path),
      ...userPhotoObjects.paths,
    ])];
    if (!photoPaths.every((path) => isOwnedStoragePath(path, userId))) {
      console.error("[delete-account] found an invalid owned photo path", { userId });
      return errorResponse(500, "cleanup_failed", "Could not safely remove account photos.");
    }

    // Delete Storage first. A failure leaves Auth and database records intact so
    // the caller can retry instead of losing access to still-retained content.
    const photoRemoval = await removeStorageObjects(USER_PHOTOS_BUCKET, photoPaths);
    if (photoRemoval.error) {
      console.error("[delete-account] photo storage cleanup failed", photoRemoval.error);
      return errorResponse(500, "cleanup_failed", "Could not remove account photos. Please try again.");
    }

    if (userAvatarObjects.paths.length > 0) {
      const avatarRemoval = await removeStorageObjects(USER_AVATARS_BUCKET, userAvatarObjects.paths);
      if (avatarRemoval.error) {
        console.error("[delete-account] avatar storage cleanup failed", avatarRemoval.error);
        return errorResponse(500, "cleanup_failed", "Could not remove your avatar. Please try again.");
      }
    }

    const recordDeletion = await deleteAppRecords(
      userId,
      ownedPhotos.map((photo) => photo.id),
    );
    if (recordDeletion.error) {
      console.error("[delete-account] database cleanup failed", recordDeletion.error);
      return errorResponse(500, "cleanup_failed", "Could not remove account data. Please try again.");
    }

    // Revoke refresh tokens before removing Auth. Existing access tokens remain
    // valid only until their normal expiry, as documented by Supabase Auth.
    const { error: signOutError } = await adminClient.auth.admin.signOut(accessToken, "global");
    if (signOutError) {
      console.error("[delete-account] session revocation failed", signOutError);
      return errorResponse(500, "session_revocation_failed", "Could not finalize account deletion. Please try again.");
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId, false);
    if (deleteUserError) {
      console.error("[delete-account] auth user deletion failed", deleteUserError);
      return errorResponse(500, "auth_deletion_failed", "Could not finalize account deletion. Please contact support.");
    }

    return response(200, { deleted: true });
  } catch (error) {
    console.error("[delete-account] unexpected failure", error);
    return errorResponse(500, "internal_error", "Could not delete the account. Please try again.");
  }
});
