export type GenerateQuoteRequest = {
  personaId: string;
  personaTraits: string[];
  imageContext?: string;
  imageUri?: string;
  model?: string;
};

export type GenerateQuoteResponse = {
  quote: string;
  isValid: boolean;
  reason?: string;
};
