import type { PostHogEventProperties } from "@posthog/core";
import PostHog from "posthog-react-native";

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
  properties?: PostHogEventProperties,
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
