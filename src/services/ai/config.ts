export const GPT_CONFIG = {
  model: process.env.EXPO_PUBLIC_GPT_MODEL || "gpt-4o-mini",
  apiUrl: process.env.EXPO_PUBLIC_GPT_API_URL || "",
  maxTokens: 200,
  temperature: 0.7,
  imageDetail: "low" as const,
  imageMaxTokens: 85,
};
