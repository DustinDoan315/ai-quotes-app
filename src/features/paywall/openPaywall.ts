import { router } from "expo-router";

import { analyticsEvents } from "@/services/analytics/events";

import type { PaywallReason, PaywallSource } from "./types";

const DUPLICATE_OPEN_WINDOW_MS = 1200;

type PaywallOpenParams = {
  reason: PaywallReason;
  source: PaywallSource;
};

let lastOpenSignature: string | null = null;
let lastOpenAt = 0;

export function shouldOpenPaywall(
  params: PaywallOpenParams,
  now: number = Date.now(),
): boolean {
  const signature = `${params.reason}:${params.source}`;
  const isDuplicate =
    signature === lastOpenSignature &&
    now - lastOpenAt < DUPLICATE_OPEN_WINDOW_MS;

  if (isDuplicate) {
    return false;
  }

  lastOpenSignature = signature;
  lastOpenAt = now;
  return true;
}

export function openPaywall(params: PaywallOpenParams): void {
  if (!shouldOpenPaywall(params)) {
    return;
  }

  analyticsEvents.paywallOpenRequested(params.reason, params.source);
  router.push({
    pathname: "/modal/paywall",
    params: {
      reason: params.reason,
      source: params.source,
    },
  });
}
