import { trackEvent } from './posthog';

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

  paywallViewed: () => {
    trackEvent("paywall_viewed");
  },
};
