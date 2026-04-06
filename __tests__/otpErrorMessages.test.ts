import { useUserStore } from "@/appState/userStore";
import { toFriendlyOtpError } from "@/utils/otpErrorMessages";

describe("otp error messages", () => {
  const initialState = useUserStore.getState();
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: localStorageMock },
      configurable: true,
    });
  });

  afterEach(() => {
    useUserStore.setState({ appLanguage: initialState.appLanguage });
  });

  it("returns english-friendly email errors", () => {
    useUserStore.setState({ appLanguage: "en" });

    expect(toFriendlyOtpError("Invalid email address")).toBe(
      "That email address doesn't look valid. Double-check it and try again.",
    );
  });

  it("returns vietnamese-friendly code errors", () => {
    useUserStore.setState({ appLanguage: "vi" });

    expect(toFriendlyOtpError("Token invalid")).toBe(
      "Mã xác thực không đúng. Hãy thử lại.",
    );
  });
});
