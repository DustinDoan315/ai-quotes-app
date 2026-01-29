import type { GenerateQuoteRequest } from "./types";

export const buildQuotePrompt = (request: GenerateQuoteRequest): string => {
  const { personaTraits, imageContext } = request;

  const traitsDescription = personaTraits.join(", ");

  let prompt = `You are a quote generator. Create an inspirational quote that matches these personality traits: ${traitsDescription}. `;

  if (imageContext) {
    prompt += `Consider this visual context: ${imageContext}. `;
  }

  prompt += `Requirements:
- Maximum 180 characters (including spaces)
- Inspirational and positive tone
- No profanity, offensive content, or inappropriate language
- No medical, legal, or financial advice
- Suitable for daily motivation
- Be concise and impactful
- Return only the quote text, no attribution or explanation`;

  return prompt;
};
