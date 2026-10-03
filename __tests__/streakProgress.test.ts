import { getStreakProgress } from "../src/utils/streakMilestones";

describe("streak total progress", () => {
  it.each([
    [0, 1, 0], [1, 5, 0.2], [4, 5, 0.8], [5, 10, 0.5],
    [10, 21, 10 / 21], [20, 21, 20 / 21], [21, null, 1],
    [-1, 1, 0], [NaN, 1, 0],
  ])("matches the count/target label for %s days", (streak, nextMilestone, progressRatio) => {
    expect(getStreakProgress(streak)).toEqual({ nextMilestone, progressRatio });
  });
});
