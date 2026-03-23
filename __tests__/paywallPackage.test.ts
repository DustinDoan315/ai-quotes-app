import { pickBestValuePackageId } from "@/utils/paywallPackage";

describe("pickBestValuePackageId", () => {
  it("prefers annual", () => {
    expect(
      pickBestValuePackageId(["monthly", "annual_premium", "lifetime"]),
    ).toBe("annual_premium");
  });

  it("prefers lifetime when no annual", () => {
    expect(pickBestValuePackageId(["monthly", "lifetime"])).toBe("lifetime");
  });

  it("returns null for empty list", () => {
    expect(pickBestValuePackageId([])).toBeNull();
  });
});
