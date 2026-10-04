import { HomeCameraSection, type HomeCameraSectionProps } from "@/features/home/HomeCameraSection";
import { useTranslation } from "react-i18next";
import { Pressable, Text, ScrollView, View } from "react-native";

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
  return <View style={{ height: viewportHeight, paddingTop: contentTop }}>
    <ScrollView style={{ height: contentHeight, flexGrow: 0 }} contentContainerStyle={{ minHeight: contentHeight }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {feedError ? <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "white", flex: 1 }}>{t("home.feedRefreshError")}</Text>
        <Pressable accessibilityRole="button" onPress={onRetryFeed} style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 12 }}><Text style={{ color: "white" }}>{t("home.captureFlow.retry")}</Text></Pressable>
      </View> : null}
      <View style={{ minHeight: contentHeight }}><HomeCameraSection {...cameraSectionProps} /></View>
    </ScrollView>
  </View>;
}
