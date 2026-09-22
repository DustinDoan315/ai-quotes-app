export type GenerationStage =
  | "idle"
  | "preparing"
  | "matching"
  | "writing"
  | "revealing";

export const getGenerationStageLabelKey = (
  stage: GenerationStage,
): string | null => (stage === "idle" ? null : `home.generating.${stage}`);

export const getGenerationResultStage = (hasQuote: boolean): GenerationStage =>
  hasQuote ? "revealing" : "idle";
