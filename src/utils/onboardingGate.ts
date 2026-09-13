export function shouldShowOnboarding({
  persona,
  profile,
  onboardingCompleted,
}: {
  persona: unknown;
  profile: unknown;
  onboardingCompleted: boolean;
}): boolean {
  return !onboardingCompleted && !persona && !profile;
}
