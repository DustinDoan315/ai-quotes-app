import type { GenerateQuoteRequest } from "./types";

export const buildQuotePrompt = (request: GenerateQuoteRequest): string => {
  const { personaTraits } = request;

  const traitsDescription = personaTraits.join(", ");

  let prompt = `You are a quote writer for a personal life journal. Create a short, emotionally aware quote that matches these personality traits: ${traitsDescription}. Avoid generic advice or clichés. `;

  if (request.base64Image) {
    prompt += "The user has shared a real photo from their life. Infer what might be happening in the scene (specific objects, setting, time of day, mood, effort, energy). Do not describe the photo directly. Instead, capture the emotional meaning of that exact moment for the user, as if you are noticing one small but meaningful detail in their situation. ";
  }

  prompt += `Requirements:
- Maximum 180 characters (including spaces)
- Warm, supportive tone (can be calm, gentle, or quietly motivating)
- No profanity, offensive content, or inappropriate language
- No medical, legal, or financial advice
- Suitable for daily motivation
- Prefer first or second person ("I", "you") so it feels personal
- Be concrete and specific, not vague; avoid phrases like "success", "future", "journey", "never give up"
- Be concise and impactful
- Return only the quote text, no attribution or explanation

Bad example (too generic, just a description):
- "Stay focused."

Better example (emotionally interprets a messy late-night desk photo):
- "Even in chaos, you’re still showing up — that’s enough today."`;

  return prompt;
};
