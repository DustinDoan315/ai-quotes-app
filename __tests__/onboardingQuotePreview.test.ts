/* eslint-disable import/first */

import React from "react";

jest.mock("moti", () => ({
  MotiView: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    { displayName: "MotiView" },
  ),
}));
jest.mock("expo-image", () => ({ Image: "PhotoImage" }));
jest.mock("@/components/InklyShareWatermark", () => ({
  InklyShareWatermark: "ShareWatermark",
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

function createPreview(reduceMotion: boolean, showWatermark = false) {
  return OnboardingQuotePreview({
    width: 210,
    quote: "coffee first, everything else can wait ☕",
    attribution: "A MOMENT, KEPT",
    sampleLabel: "SAMPLE",
    showWatermark,
    reduceMotion,
  });
}

describe("OnboardingQuotePreview", () => {
  it("uses a bundled photo and reveals its caption after the photo", () => {
    const elements = getElements(createPreview(false));
    const photo = elements.find((element) => element.type as unknown === "PhotoImage");
    const caption = elements.find((element) => "from" in element.props);
    const watermark = elements.find((element) => element.type as unknown === "ShareWatermark");
    expect(photo?.props.source).toBeDefined();
    expect(photo?.props.contentFit).toBe("cover");
    expect(caption?.props.from).toEqual({ opacity: 0, translateY: 14 });
    expect(caption?.props.transition).toMatchObject({ delay: 900 });
    expect(watermark?.props.visible).toBe(false);
  });

  it("shows the finished sharing example with the logo watermark immediately", () => {
    const elements = getElements(createPreview(false, true));
    const caption = elements.find((element) => "from" in element.props);
    const watermark = elements.find((element) => element.type as unknown === "ShareWatermark");
    expect(caption?.props.from).toEqual({ opacity: 1, translateY: 0 });
    expect(caption?.props.transition).toMatchObject({ duration: 0, delay: 0 });
    expect(watermark?.props.visible).toBe(true);
  });

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
