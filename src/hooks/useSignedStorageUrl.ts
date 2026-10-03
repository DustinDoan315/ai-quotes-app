import { supabase } from "@/config/supabase";
import { useEffect, useState } from "react";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Resolves a private Storage path without persisting an expiring URL. */
export function useSignedStorageUrl(
  bucket: string,
  storagePath: string | null | undefined,
  fallbackUrl: string | null,
): string | null {
  const localFallback = fallbackUrl && /^(file|content|data|ph):/i.test(fallbackUrl) ? fallbackUrl : null;
  const [url, setUrl] = useState<string | null>(
    storagePath ? localFallback : fallbackUrl,
  );

  useEffect(() => {
    let cancelled = false;

    if (!storagePath) {
      setUrl(fallbackUrl);
      return () => {
        cancelled = true;
      };
    }

    setUrl(localFallback);

    void supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (!cancelled) {
          setUrl(error ? localFallback : data?.signedUrl ?? localFallback);
        }
      }).catch(() => {
        if (!cancelled) setUrl(localFallback);
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, fallbackUrl, localFallback, storagePath]);

  return url;
}
