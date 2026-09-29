/* eslint-disable import/first */

import React from "react";

jest.mock("moti", () => ({
  MotiView: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    { displayName: "MotiView" },
  ),
}));
jest.mock("@/features/home/HomeBackground", () => ({
  HomeBackground: () => null,
}));

import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import { OnboardingQuotePreview } from "@/features/onboarding/components/OnboardingQuotePreview";

type TestElement = React.ReactElement<Record<string, unknown>>;

function getElements(node: React.ReactNode): TestElement[] {
  return React.Children.toArray(node).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    const element = child as TestElement & React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return [element, ...getElements(element.props.children)];
  });
}

function createPreview(reduceMotion: boolean) {
  return OnboardingQuotePreview({
    width: 210,
    quote: "A small, true thing— carried gently— is enough.",
    attribution: "A MOMENT, KEPT",
    sampleLabel: "SAMPLE",
    quotePositionY: 42,
    reduceMotion,
  });
}

describe("OnboardingQuotePreview", () => {
  it("uses the shared quote card aspect and has no tappable sample controls", () => {
    const preview = createPreview(false);
    const elements = getElements(preview);

    expect(preview.props.style.aspectRatio).toBe(QUOTE_DISPLAY_ASPECT);
    expect(preview.props.style.pointerEvents).toBe("none");
    expect(elements.some((element) => "onPress" in element.props)).toBe(false);
  });

  it("shows the completed quote immediately when reduced motion is enabled", () => {
    const elements = getElements(createPreview(true));
    const quoteMotion = elements.find(
      (element) =>
        typeof element.type !== "string" &&
        (element.type as unknown as { displayName?: string }).displayName ===
          "MotiView",
    );

    expect(quoteMotion?.props.from).toEqual({ opacity: 1, translateY: 0 });
    expect(quoteMotion?.props.transition).toEqual({
      type: "timing",
      duration: 0,
      delay: 0,
    });
  });
});
