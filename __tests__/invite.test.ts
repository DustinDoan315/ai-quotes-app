import {
  APP_STORE_URL,
  INVITE_WEB_ORIGIN,
  buildPublicInviteUrl,
} from "@/config/appLinks";
import { parseInviteCode } from "@/utils/invite";

describe("invite links", () => {
  it("uses the published App Store URL as the fallback destination", () => {
    expect(APP_STORE_URL).toBe(
      "https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001",
    );
  });

  it("uses the controlled HTTPS host for public invite links", () => {
    expect(INVITE_WEB_ORIGIN).toBe("https://inkly-web-taupe.vercel.app");
    expect(buildPublicInviteUrl("abc12345")).toBe(
      "https://inkly-web-taupe.vercel.app/invite/abc12345",
    );
  });

  it("keeps parsing legacy installed-app invite links", () => {
    expect(parseInviteCode("inkly://invite/abc12345")).toBe("abc12345");
  });

  it("parses public HTTPS invite paths", () => {
    expect(parseInviteCode("https://inkly-web-taupe.vercel.app/invite/abc12345")).toBe(
      "abc12345",
    );
  });
});
