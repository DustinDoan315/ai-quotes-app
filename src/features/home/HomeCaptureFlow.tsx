import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import Animated, { LinearTransition } from "react-native-reanimated";
import { HomeCameraSection, type HomeCameraSectionProps } from "@/features/home/HomeCameraSection";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type Props = {
  viewportHeight: number;
  contentTop: number;
  contentHeight: number;
  feedError?: boolean;
  onRetryFeed?: () => void;
  cameraSectionProps: HomeCameraSectionProps;
};
export function HomeCaptureFlow({ viewportHeight, contentTop, contentHeight, feedError, onRetryFeed, cameraSectionProps }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotionPreference();
  const layoutTransition = LinearTransition.duration(
    reduceMotion || cameraSectionProps.interactionLocked || cameraSectionProps.isSharing || cameraSectionProps.isSavingPhoto || cameraSectionProps.watermarkForExport ? 0 : 300,
  );
  const content = <>
      {feedError && !cameraSectionProps.selectedImageUri ? <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "white", flex: 1 }}>{t("home.feedRefreshError")}</Text>
        <Pressable accessibilityRole="button" onPress={onRetryFeed} style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 12 }}><Text style={{ color: "white" }}>{t("home.captureFlow.retry")}</Text></Pressable>
      </View> : null}
      <View style={{ minHeight: contentHeight }}><HomeCameraSection {...cameraSectionProps} /></View>
  </>;
  return <View style={{ height: viewportHeight }}>
    {cameraSectionProps.selectedImageUri ? <Animated.View layout={layoutTransition} style={{ marginTop: contentTop, height: contentHeight }}>{content}</Animated.View> : <Animated.ScrollView layout={layoutTransition} style={{ marginTop: contentTop, height: contentHeight, flexGrow: 0 }} contentContainerStyle={{ minHeight: contentHeight }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</Animated.ScrollView>}
  </View>;
}
