import type { Href, Router } from "expo-router";

type BackCapableRouter = Pick<Router, "back" | "canGoBack" | "replace">;

export function goBackOrReplace(
  router: BackCapableRouter,
  fallbackHref: Href,
): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
