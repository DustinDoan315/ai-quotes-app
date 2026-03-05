import {
  getMilestoneMessage,
  getStreakTier,
  type StreakTier,
} from "@/utils/streakMilestones";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useEffect } from "react";
import { Modal, Pressable, Text } from "react-native";

interface MilestoneCelebrationProps {
  milestone: number | null;
  onDismiss: () => void;
}

const DURATION_MS = 3000;

export function MilestoneCelebration({
  milestone,
  onDismiss,
}: MilestoneCelebrationProps) {
  useEffect(() => {
    if (milestone === null) return;
    const t = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(t);
  }, [milestone, onDismiss]);

  if (milestone === null) return null;

  const tier: StreakTier = getStreakTier(milestone);
  const message = getMilestoneMessage(milestone);

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
      <Pressable
        className="flex-1 items-center justify-center bg-black/60"
        onPress={onDismiss}>
        <Pressable
          className="mx-6 max-w-sm"
          onPress={(e) => e.stopPropagation()}>
          <MotiView
            from={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "timing",
              duration: 600,
            }}
            className="items-center rounded-3xl border border-white/20 bg-black/80 px-8 py-8 shadow-xl">
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "timing",
                duration: 500,
                delay: 100,
              }}
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${tier.color}20` }}>
              <Ionicons name={tier.icon} size={36} color={tier.color} />
            </MotiView>
            <Text className="mb-1 text-3xl font-bold text-white">
              {milestone} {milestone === 1 ? "day" : "days"}
            </Text>
            <Text className="text-center text-base text-white/90">
              {message}
            </Text>
            <Text className="mt-3 text-xs text-white/50">
              Tap or wait to continue
            </Text>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
