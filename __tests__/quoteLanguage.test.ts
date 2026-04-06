import { useUserStore } from "@/appState/userStore";
import { getQuoteLanguage } from "@/services/ai/quoteLanguage";

describe("quote language resolver", () => {
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
    useUserStore.setState({
      appLanguage: initialState.appLanguage,
      quoteLanguage: initialState.quoteLanguage,
    });
  });

  it("returns the explicit quote language preference", () => {
    useUserStore.setState({ appLanguage: "vi", quoteLanguage: "en" });

    expect(getQuoteLanguage()).toBe("en");
  });

  it("falls back to the app language when quote language is missing", () => {
    useUserStore.setState({ appLanguage: "vi", quoteLanguage: undefined as never });

    expect(getQuoteLanguage()).toBe("vi");
  });
});
