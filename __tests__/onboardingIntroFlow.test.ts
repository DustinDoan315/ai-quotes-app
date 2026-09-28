/* eslint-disable import/first */

type IntroScreen = {
  type: { name?: string };
  props: Record<string, () => void>;
};

const mockStepState = { value: 0 };
const mockUserStoreState = {
  persona: null,
  profile: null,
  onboardingCompleted: false,
  completeOnboarding: jest.fn(),
};
const mockRouter = { replace: jest.fn(), push: jest.fn() };

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useState: () => [
      mockStepState.value,
      (next: number | ((current: number) => number)) => {
        mockStepState.value =
          typeof next === "function" ? next(mockStepState.value) : next;
      },
    ],
    useCallback: (callback: (...args: never[]) => unknown) => callback,
  };
});
jest.mock("@/appState/userStore", () => ({
  useUserStore: (selector: (state: typeof mockUserStoreState) => unknown) =>
    selector(mockUserStoreState),
}));
jest.mock("@/utils/useUserStoreHydrated", () => ({
  useUserStoreHydrated: () => true,
}));
jest.mock("expo-router", () => ({
  Redirect: () => null,
  useRouter: () => mockRouter,
}));
jest.mock("@/features/onboarding/steps/WelcomeStep", () => ({
  WelcomeStep: function WelcomeStep() {},
}));
jest.mock("@/features/onboarding/steps/HowItWorksSaveStep", () => ({
  HowItWorksSaveStep: function HowItWorksSaveStep() {},
}));

import OnboardingScreen from "../app/(onboarding)/index";

function renderRoute(): IntroScreen {
  return OnboardingScreen() as unknown as IntroScreen;
}

describe("two-screen onboarding navigation", () => {
  beforeEach(() => {
    mockStepState.value = 0;
    mockRouter.replace.mockClear();
    mockRouter.push.mockClear();
    mockUserStoreState.completeOnboarding.mockClear();
  });

  it("continues to screen two and goes back to the welcome screen", () => {
    const welcome = renderRoute();
    expect(welcome.type.name).toBe("WelcomeStep");

    welcome.props.onContinue();
    const finalScreen = renderRoute();
    expect(finalScreen.type.name).toBe("HowItWorksSaveStep");

    finalScreen.props.onBack();
    expect(renderRoute().type.name).toBe("WelcomeStep");
  });

  it("completes and opens Home when either screen is skipped or finished", () => {
    const welcome = renderRoute();
    welcome.props.onSkip();
    expect(mockUserStoreState.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");

    mockUserStoreState.completeOnboarding.mockClear();
    mockRouter.replace.mockClear();
    mockStepState.value = 0;
    renderRoute().props.onContinue();
    const finalScreen = renderRoute();
    finalScreen.props.onSkip();
    expect(mockUserStoreState.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");

    mockUserStoreState.completeOnboarding.mockClear();
    mockRouter.replace.mockClear();
    mockStepState.value = 0;
    renderRoute().props.onContinue();
    renderRoute().props.onComplete();
    expect(mockUserStoreState.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });
});
