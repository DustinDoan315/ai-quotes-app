import { QuoteMomentCardMedia } from "@/features/quotes/QuoteMomentCardMedia";
import { useQuoteMomentShare } from "@/features/quotes/useQuoteMomentShare";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { useEffect, useCallback, type ReactNode } from "react";
import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import { useQuoteCardFrame } from "@/features/quotes/useQuoteCardFrame";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { HOME_AMBIENT_LAYOUT, getHomeAmbientColors } from "@/theme/homeAmbient";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useUserStore } from "@/appState";

export interface QuoteMomentCardProps {
  item: QuotePhotoCard;
  screenHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  counterLabel?: string | null;
  dotsContent?: ReactNode;
  presentation?: "default" | "home";
  frameWidth?: number;
  contentTop?: number;
  contentHeight?: number;
  viewerUserId?: string | null;
  viewerGuestId?: string | null;
  isActive?: boolean;
  onRegisterShare?: (quoteId: string, share: () => Promise<void>) => void | (() => void);
  onSharingChange?: (sharing: boolean) => void;
}

export const QuoteMomentCard = ({
  item,
  screenHeight,
  authorName,
  authorAvatarUrl,
  counterLabel,
  dotsContent,
  presentation = "default", frameWidth, contentTop, contentHeight,
  viewerUserId, viewerGuestId, isActive = true, onRegisterShare, onSharingChange,
}: QuoteMomentCardProps) => {
  const { t, i18n } = useTranslation();
  const frame = useQuoteCardFrame();
  const authUserId = useUserStore((s) => s.authUserId);
  const guestId = useUserStore((s) => s.guestId);
  const width = frameWidth ?? frame.width;
  const isHome = presentation === "home";
  const { captureRefView, watermarkForExport, shareMoment } =
    useQuoteMomentShare(onSharingChange);
  const bgPalette = item.homeVibeKey
    ? getHomeBackgroundPaletteByKey(item.homeVibeKey)
    : null;
  const homeColors = getHomeAmbientColors(bgPalette ?? getHomeBackgroundPaletteByKey("mist"));
  const chrome = bgPalette ? getHomeVibeFeedChrome(bgPalette) : null;
  const ownUser = viewerUserId === undefined ? authUserId : viewerUserId;
  const ownGuest = viewerGuestId === undefined ? guestId : viewerGuestId;
  const baseDisplayName = item.authorDisplayName ?? authorName;
  const isMine =
    (ownUser && item.userId && item.userId === ownUser) ||
    (!item.userId && ownGuest && item.guestId && item.guestId === ownGuest);
  const displayName = isMine ? (isHome ? t("home.ambient.you", { defaultValue: "You" }) : "Me") : (item.authorDisplayName ?? (isHome ? t("home.ambient.friendAuthorFallback") : baseDisplayName));
  const displayAvatar = item.authorAvatarUrl ?? (isHome && !isMine ? null : authorAvatarUrl);
  const shareActive = useCallback(() => shareMoment(item.id), [shareMoment, item.id]);
  useEffect(() => {
    if (!isHome || !isActive || !item.imageUrl || !onRegisterShare) return;
    return onRegisterShare(item.id, shareActive);
  }, [isHome, isActive, item.imageUrl, item.id, onRegisterShare, shareActive]);

  const createdTimeLabel = new Date(item.createdAt).toLocaleTimeString(
    i18n.language,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const createdDateLabel = new Date(item.createdAt).toLocaleDateString(
    i18n.language,
    { month: "short", day: "numeric" },
  );

  const fontSize =
    item.styleFontId === "small" ? 16 : item.styleFontId === "large" ? 24 : 18;
  const textColor =
    item.styleColorSchemeId === "amber"
      ? "#FBBF24"
      : item.styleColorSchemeId === "pink"
        ? "#F9A8D4"
        : "#FFFFFF";

  const mediaBlock = (
    <QuoteMomentCardMedia
      item={item}
      presentation={presentation}
      chrome={chrome}
      aspectRatio={QUOTE_DISPLAY_ASPECT}
      watermarkForExport={watermarkForExport}
      displayName={displayName}
      avatarFallbackName={displayName}
      displayAvatar={displayAvatar}
      createdTimeLabel={createdTimeLabel}
      createdDateLabel={createdDateLabel}
      fontSize={fontSize}
      textColor={textColor}
    />
  );

  const cardInner =
    isHome ? (
      <View style={{ width, borderRadius: HOME_AMBIENT_LAYOUT.radius, overflow: "hidden", borderWidth: 1, borderColor: homeColors.edge, shadowColor: homeColors.edge, shadowOpacity: 0.35, shadowRadius: 12, backgroundColor: "#09090b" }}>
        {mediaBlock}
      </View>
    ) : chrome && bgPalette ? (
      <View
        className="w-full overflow-hidden rounded-[28px]"
        style={[chrome.outerShell, { width }]}
      >
        <View className="relative overflow-hidden rounded-[28px] bg-black">
          <View pointerEvents="none" style={chrome.hairline} />
          {mediaBlock}
        </View>
      </View>
    ) : (
      <View style={{ width }} className="overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-lg shadow-black/50">
        {mediaBlock}
      </View>
    );

  return (
    <View
      style={{ height: screenHeight, ...(contentTop != null ? { justifyContent: 'flex-start', paddingTop: contentTop, paddingBottom: Math.max(0, screenHeight - contentTop - (contentHeight ?? width)) } : {}) }}
      className="items-center justify-center"
    >
      <View className="relative items-center" style={{ width }}>
        <View ref={captureRefView} collapsable={false} className="w-full">
          {cardInner}
        </View>
        {isHome || watermarkForExport || !counterLabel ? null : (
          <View pointerEvents="none" className="absolute left-3 top-3 z-50">
            <View className="flex-row items-center rounded-full border border-white/15 bg-black/45 px-3 py-1">
              <Text className="text-[11px] font-semibold text-white/90">
                {counterLabel}
              </Text>
            </View>
          </View>
        )}
        {isHome || watermarkForExport ? null : (
          <Pressable
            accessibilityLabel={t("home.momentsFeed.shareMomentA11y")}
            onPress={() => {
              void shareMoment(item.id);
            }}
            className="absolute right-2 top-2 z-50 rounded-full bg-black/55 p-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Ionicons name="share-outline" size={22} color="#ffffff" />
          </Pressable>
        )}
        {!isHome && dotsContent ? (
          <View
            pointerEvents="none"
            className="absolute bottom-3 self-center z-50"
          >
            {dotsContent}
          </View>
        ) : null}
      </View>
    </View>
  );
};
