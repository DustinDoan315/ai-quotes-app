import { getDisplayStreak } from "@/appState/streakStore";
import { getTodayLocalDateKey, getYesterdayLocalDateKey } from "@/utils/dateKey";

describe("getDisplayStreak", () => {
  it("returns the current streak when last quote was today", () => {
    expect(
      getDisplayStreak({
        currentStreak: 7,
        lastQuoteDate: getTodayLocalDateKey(),
      }),
    ).toBe(7);
  });

  it("returns the current streak when last quote was yesterday (streak still live)", () => {
    expect(
      getDisplayStreak({
        currentStreak: 3,
        lastQuoteDate: getYesterdayLocalDateKey(),
      }),
    ).toBe(3);
  });

  it("returns 0 when last quote was two or more days ago (streak broken)", () => {
    expect(
      getDisplayStreak({
        currentStreak: 5,
        lastQuoteDate: "2000-01-01",
      }),
    ).toBe(0);
  });

  it("returns 0 when lastQuoteDate is null", () => {
    expect(
      getDisplayStreak({
        currentStreak: 0,
        lastQuoteDate: null,
      }),
    ).toBe(0);
  });
});
