import { getFeedCardWidth } from "@/features/quotes/feedCardSizing";

describe("getFeedCardWidth", () => {
  it("keeps the phone card cap", () => {
    expect(getFeedCardWidth(430)).toBe(398);
    expect(getFeedCardWidth(500)).toBe(448);
  });

  it("uses a larger card on tablet displays", () => {
    expect(getFeedCardWidth(768)).toBe(620);
    expect(getFeedCardWidth(1032)).toBe(620);
  });
});
