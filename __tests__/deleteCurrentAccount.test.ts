/* eslint-disable import/first */

const mockGetSession = jest.fn();
const mockInvoke = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

import {
  DeleteAccountError,
  deleteCurrentAccount,
} from "@/services/supabase-auth";

describe("deleteCurrentAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuses to delete when there is no authenticated session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await deleteCurrentAccount();

    expect(result).toEqual({
      deleted: false,
      error: expect.objectContaining({ code: "no_authenticated_session" }),
    });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("refuses to delete an anonymous session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { is_anonymous: true } } },
      error: null,
    });

    const result = await deleteCurrentAccount();

    expect(result.error).toBeInstanceOf(DeleteAccountError);
    expect(result.error?.code).toBe("anonymous_session");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("invokes the deletion function with the required confirmation and waits for success", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { is_anonymous: false } } },
      error: null,
    });
    mockInvoke.mockResolvedValue({ data: { deleted: true }, error: null });

    const result = await deleteCurrentAccount();

    expect(mockInvoke).toHaveBeenCalledWith("delete-account", {
      body: { confirmation: "DELETE" },
    });
    expect(result).toEqual({ deleted: true, error: null });
  });

  it("returns an error without clearing the session when the function fails", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { is_anonymous: false } } },
      error: null,
    });
    mockInvoke.mockResolvedValue({ data: null, error: { message: "Server unavailable" } });

    const result = await deleteCurrentAccount();

    expect(result.deleted).toBe(false);
    expect(result.error?.code).toBe("request_failed");
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});
