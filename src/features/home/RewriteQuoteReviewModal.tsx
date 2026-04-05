import {
  MAX_REWRITE_REVIEW_CHARACTERS,
  validateRewriteReviewQuote,
} from "@/services/ai/rewriteReview";
import { strings } from "@/theme/strings";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  initialText: string;
  sourceText: string;
  onApprove: (text: string) => void;
  onCancel: () => void;
}

export function RewriteQuoteReviewModal({
  visible,
  initialText,
  sourceText,
  onApprove,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initialText);
  const validation = useMemo(
    () => validateRewriteReviewQuote(text, sourceText),
    [text, sourceText],
  );

  useEffect(() => {
    if (visible) {
      setText(initialText);
    }
  }, [visible, initialText]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        className="flex-1 bg-slate-950"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-row items-center border-b border-white/10 px-3 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onCancel}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text className="flex-1 text-center text-base font-bold text-white">
            {strings.home.aiTools.rewriteReviewTitle}
          </Text>
          <View className="w-11" />
        </View>
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="mb-3 text-sm leading-5 text-white/65">
            {strings.home.aiTools.rewriteGuidance}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            className="min-h-[200px] rounded-2xl border border-amber-500/35 bg-white/5 px-4 py-3 text-base leading-6 text-white"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={{ color: "#FFFFFF" }}
          />
          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: validation.isValid ? "rgba(255,255,255,0.6)" : "#FCA5A5" }}>
              {validation.isValid
                ? strings.home.aiTools.rewriteReady
                : validation.reason}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{
                color:
                  validation.remainingCharacters < 0 ? "#FCA5A5" : "rgba(255,255,255,0.65)",
              }}>
              {validation.characterCount}/{MAX_REWRITE_REVIEW_CHARACTERS}
            </Text>
          </View>
        </ScrollView>
        <View className="flex-row gap-3 border-t border-white/10 px-4 py-3">
          <Pressable
            onPress={onCancel}
            className="flex-1 items-center rounded-2xl border border-white/20 py-3.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-base font-semibold text-white">
              {strings.home.aiTools.rewriteCancel}
            </Text>
          </Pressable>
          <Pressable
            disabled={!validation.isValid}
            onPress={() => onApprove(validation.sanitizedQuote)}
            className="flex-1 items-center rounded-2xl bg-amber-500 py-3.5"
            style={({ pressed }) => ({
              opacity: !validation.isValid ? 0.45 : pressed ? 0.9 : 1,
            })}>
            <Text className="text-base font-bold text-stone-950">
              {strings.home.aiTools.rewriteApprove}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
