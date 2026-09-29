/* eslint-disable import/first */

const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect, insert: mockInsert }));

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock("@/services/analytics/sentry", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

import { acceptInviteCode } from "@/services/inviteApi";

const MY_USER_ID = "user-me";
const INVITER_ID = "user-friend";

describe("acceptInviteCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockReturnValue({ error: null });
  });

  it("resolves the code case-insensitively before looking it up", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: INVITER_ID }, error: null });

    await expect(acceptInviteCode("  ABC12345 ", MY_USER_ID)).resolves.toBe("success");
    expect(mockEq).toHaveBeenCalledWith("code", "abc12345");
  });

  it("reports an unknown code as invalid", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(acceptInviteCode("nope1234", MY_USER_ID)).resolves.toBe("invalid");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("refuses the caller's own invite code", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: MY_USER_ID }, error: null });

    await expect(acceptInviteCode("abc12345", MY_USER_ID)).resolves.toBe("self");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("connects both directions on success", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: INVITER_ID }, error: null });

    await expect(acceptInviteCode("abc12345", MY_USER_ID)).resolves.toBe("success");
    expect(mockInsert).toHaveBeenNthCalledWith(1, {
      user_id: MY_USER_ID,
      friend_id: INVITER_ID,
    });
    expect(mockInsert).toHaveBeenNthCalledWith(2, {
      user_id: INVITER_ID,
      friend_id: MY_USER_ID,
    });
  });

  it("treats an existing friendship as success", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: INVITER_ID }, error: null });
    mockInsert.mockReturnValue({ error: { code: "23505", message: "duplicate" } });

    await expect(acceptInviteCode("abc12345", MY_USER_ID)).resolves.toBe("success");
  });

  it("reports a write failure as an error", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: INVITER_ID }, error: null });
    mockInsert.mockReturnValue({ error: { code: "42501", message: "denied" } });

    await expect(acceptInviteCode("abc12345", MY_USER_ID)).resolves.toBe("error");
  });
});
