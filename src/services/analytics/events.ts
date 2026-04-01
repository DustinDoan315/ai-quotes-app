import { trackEvent } from './posthog';
import type { PaywallReason } from "@/features/paywall/types";

export const analyticsEvents = {
  quizCompleted: (personaId: string) => {
    trackEvent("quiz_completed", { personaId });
  },

  quoteShared: (quoteId: string) => {
    trackEvent("quote_shared", { quoteId });
  },

  quoteSaved: (quoteId: string) => {
    trackEvent("quote_saved", { quoteId });
  },

  streakIncremented: (streak: number) => {
    trackEvent("streak_incremented", { streak });
  },

  paywallViewed: (reason: PaywallReason) => {
    trackEvent("paywall_viewed", { reason });
  },

  paywallCheckoutStarted: (reason: PaywallReason, packageId: string) => {
    trackEvent("paywall_checkout_started", { reason, packageId });
  },

  paywallPurchaseSucceeded: (reason: PaywallReason, packageId: string) => {
    trackEvent("paywall_purchase_succeeded", { reason, packageId });
  },

  paywallRestoreSucceeded: (reason: PaywallReason) => {
    trackEvent("paywall_restore_succeeded", { reason });
  },
};
