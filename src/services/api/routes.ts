import { apiClient } from './client';
import { QuoteResponse } from './types';

export const apiRoutes = {
  quotes: {
    daily: () => apiClient.get<QuoteResponse>("/quotes/daily"),
    generate: (personaId: string, imageContext?: string) =>
      apiClient.post<QuoteResponse>("/quotes/generate", {
        personaId,
        imageContext,
      }),
  },
};
