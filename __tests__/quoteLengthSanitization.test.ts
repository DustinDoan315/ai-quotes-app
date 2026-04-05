import { sanitizeQuote } from "@/services/ai/safety";

describe("quote length sanitization", () => {
  it("caps quotes at 180 visible characters without adding ellipsis", () => {
    const input = ` ${"a".repeat(220)} `;

    const result = sanitizeQuote(input);

    expect(result).toHaveLength(180);
    expect(result).toBe("a".repeat(180));
    expect(result.endsWith("...")).toBe(false);
  });
});
