import PostHog from 'posthog-react-native';

let posthog: PostHog | null = null;

export const initPostHog = (apiKey: string, host?: string) => {
  if (posthog) {
    return;
  }

  posthog = new PostHog(apiKey, {
    host: host || "https://app.posthog.com",
    enableSessionReplay: false,
  });
};

export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  if (!posthog) {
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error("PostHog tracking error:", error);
  }
};

export const identifyUser = (
  userId: string,
  properties?: Record<string, unknown>,
) => {
  if (!posthog) {
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error("PostHog identify error:", error);
  }
};

export const resetUser = () => {
  if (!posthog) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error("PostHog reset error:", error);
  }
};
