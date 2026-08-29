import i18n from "@/i18n";
import { useUserStore } from "@/appState/userStore";
import { getQuoteLanguage } from "@/services/ai/quoteLanguage";

describe("language defaults", () => {
  it("starts the UI and quote generation in English", () => {
    expect(i18n.language).toBe("en");
    expect(useUserStore.getState().uiLanguage).toBe("en");
    expect(useUserStore.getState().quoteLanguage).toBe("en");
    expect(getQuoteLanguage()).toBe("en");
  });
});
