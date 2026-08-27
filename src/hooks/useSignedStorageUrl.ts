import { supabase } from "@/config/supabase";
import { useEffect, useState } from "react";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Resolves a private Storage path without persisting an expiring URL. */
export function useSignedStorageUrl(
  bucket: string,
  storagePath: string | null | undefined,
  fallbackUrl: string | null,
): string | null {
  const [url, setUrl] = useState<string | null>(
    storagePath ? null : fallbackUrl,
  );

  useEffect(() => {
    let cancelled = false;

    if (!storagePath) {
      setUrl(fallbackUrl);
      return () => {
        cancelled = true;
      };
    }

    setUrl(null);

    void supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (!cancelled) {
          setUrl(error ? null : data?.signedUrl ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, fallbackUrl, storagePath]);

  return url;
}
