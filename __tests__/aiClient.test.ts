import {
  explainQuote,
  generateFutureQuote,
  rewriteQuote,
} from "@/services/ai/client";

describe("AI client contract", () => {
  const originalFetch = global.fetch;
  const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
  });

  it("calls quote-explain and returns the explanation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "This means your small progress still counts." }),
    });

    const result = await explainQuote({
      quote: "You are still showing up.",
      personaTraits: ["curious", "optimistic"],
      language: "en",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/quote-explain",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result).toEqual({
      explanation: "This means your small progress still counts.",
      isValid: true,
    });
  });

  it("returns a server error reason for quote-rewrite", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid rewrite tone" }),
    });

    const result = await rewriteQuote({
      quote: "You are still showing up.",
      personaTraits: ["calm"],
      tone: "funny",
      language: "en",
    });

    expect(result).toEqual({
      quote: "",
      isValid: false,
      reason: "Invalid rewrite tone",
    });
  });

  it("calls quote-future and returns the next quote", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "Tomorrow gets easier when today is honest." }),
    });

    const result = await generateFutureQuote({
      quote: "You are still showing up.",
      personaTraits: ["grounded", "hopeful"],
      language: "en",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/quote-future",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result).toEqual({
      quote: "Tomorrow gets easier when today is honest.",
      isValid: true,
    });
  });

  it("fails fast when Supabase configuration is missing", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "";

    const result = await explainQuote({
      quote: "You are still showing up.",
      personaTraits: ["curious"],
      language: "en",
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      explanation: "",
      isValid: false,
      reason: "Missing Supabase configuration",
    });
  });
});
