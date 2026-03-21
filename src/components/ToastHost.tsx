import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUIStore } from "@/appState/uiStore";

const toastStyles = {
  success: {
    bar: "border-emerald-400/40 bg-emerald-700",
    text: "text-emerald-50",
    icon: "checkmark-circle" as const,
    iconColor: "#a7f3d0",
  },
  error: {
    bar: "border-red-400/40 bg-red-900/95",
    text: "text-red-50",
    icon: "close-circle" as const,
    iconColor: "#fecaca",
  },
  info: {
    bar: "border-sky-400/35 bg-slate-900/95",
    text: "text-slate-100",
    icon: "information-circle" as const,
    iconColor: "#7dd3fc",
  },
};

export const ToastHost = () => {
  const toasts = useUIStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 z-[100]"
      style={{ elevation: 100 }}>
      <View
        className="gap-2 px-4"
        style={{ paddingTop: insets.top + 8 }}>
        {toasts.map((t) => {
          const cfg = toastStyles[t.type];
          return (
            <View
              key={t.id}
              className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl ${cfg.bar}`}>
              <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
              <Text
                className={`min-w-0 flex-1 text-[15px] font-semibold leading-[21px] ${cfg.text}`}>
                {t.message}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
