import { trackEvent } from './posthog';
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";

export const analyticsEvents = {
  quizCompleted: (personaId: string) => {
    trackEvent("quiz_completed", { personaId });
  },

  quoteShared: (quoteId: string) => {
    trackEvent("quote_shared", { quoteId });
  },

  quoteMomentShared: (quoteId: string) => {
    trackEvent("quote_moment_shared", { quoteId, method: "image_export" });
  },

  inviteShared: () => {
    trackEvent("invite_shared");
  },

  quoteSaved: (quoteId: string) => {
    trackEvent("quote_saved", { quoteId });
  },

  streakIncremented: (streak: number) => {
    trackEvent("streak_incremented", { streak });
  },

  paywallOpenRequested: (reason: PaywallReason, source: PaywallSource) => {
    trackEvent("paywall_open_requested", { reason, source });
  },

  paywallViewed: (reason: PaywallReason, source: PaywallSource) => {
    trackEvent("paywall_viewed", { reason, source });
  },

  paywallCheckoutStarted: (
    reason: PaywallReason,
    source: PaywallSource,
    packageId: string,
  ) => {
    trackEvent("paywall_checkout_started", { reason, source, packageId });
  },

  paywallPurchaseSucceeded: (
    reason: PaywallReason,
    source: PaywallSource,
    packageId: string,
  ) => {
    trackEvent("paywall_purchase_succeeded", { reason, source, packageId });
  },

  paywallRestoreSucceeded: (reason: PaywallReason, source: PaywallSource) => {
    trackEvent("paywall_restore_succeeded", { reason, source });
  },
};
