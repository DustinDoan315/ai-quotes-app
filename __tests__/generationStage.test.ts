import {
  getGenerationResultStage,
  getGenerationStageLabelKey,
} from "@/features/home/generationStage";

describe("generation stages", () => {
  it("maps active stages to visible labels and leaves idle unlabeled", () => {
    expect(getGenerationStageLabelKey("idle")).toBeNull();
    expect(getGenerationStageLabelKey("matching")).toBe(
      "home.generating.matching",
    );
    expect(getGenerationStageLabelKey("revealing")).toBe(
      "home.generating.revealing",
    );
  });

  it("returns to idle when generation fails", () => {
    expect(getGenerationResultStage(false)).toBe("idle");
    expect(getGenerationResultStage(true)).toBe("revealing");
  });
});
