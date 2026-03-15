export type QuoteLanguage = "vi" | "en";

export type GenerateQuoteRequest = {
  personaId: string;
  personaTraits: string[];
  base64Image?: string;
  language?: QuoteLanguage;
  visionLanguage?: QuoteLanguage;
  debugVision?: boolean;
  model?: string;
};

export type GenerateQuoteResponse = {
  quote: string;
  isValid: boolean;
  reason?: string;
};

export type ImageDetectionResult = {
  scene_summary: string;
  observed_items: string[];
  people: string[];
  animals: string[];
  objects: string[];
  text_in_image: string[];
  setting: string;
  colors: string[];
  mood: string[];
  confidence_note: string;
};
