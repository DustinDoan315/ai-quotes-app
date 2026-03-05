export type StreakTier = {
  icon: "flame-outline" | "flame" | "trophy-outline" | "trophy";
  color: string;
  size: number;
};

const TIERS: {
  min: number;
  icon: StreakTier["icon"];
  color: string;
  size: number;
}[] = [
  { min: 0, icon: "flame-outline", color: "#ffb100", size: 20 },
  { min: 5, icon: "flame", color: "#ff9500", size: 22 },
  { min: 10, icon: "trophy-outline", color: "#ffaa00", size: 22 },
  { min: 20, icon: "trophy", color: "#ffd700", size: 24 },
];

export const STREAK_MILESTONES = [1, 5, 10, 21] as const;

export function isStreakMilestone(streak: number): streak is 1 | 5 | 10 | 20 {
  return STREAK_MILESTONES.includes(
    streak as (typeof STREAK_MILESTONES)[number],
  );
}

const MILESTONE_MESSAGES: Record<number, string> = {
  1: "First streak day! You're on fire.",
  5: "5 days in a row! Keep it burning.",
  10: "10-day streak! You're a champion.",
  20: "20 days! New habit unlocked.",
};

export function getMilestoneMessage(milestone: number): string {
  return MILESTONE_MESSAGES[milestone] ?? `${milestone} day streak!`;
}

export function getStreakTier(streak: number): StreakTier {
  let tier = TIERS[0];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (streak >= TIERS[i].min) {
      tier = TIERS[i];
      break;
    }
  }
  return { icon: tier.icon, color: tier.color, size: tier.size };
}
