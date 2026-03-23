import { RevenueCatConfig } from "@/config/revenuecat";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function RevenueCatTestScreen() {
  const loadOfferings = useSubscriptionStore((s) => s.loadOfferings);
  const offerings = useSubscriptionStore((s) => s.offerings);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const errorMessage = useSubscriptionStore((s) => s.errorMessage);
  const selectedPackageId = useSubscriptionStore((s) => s.selectedPackageId);
  const setSelectedPackageId = useSubscriptionStore(
    (s) => s.setSelectedPackageId,
  );
  const purchaseSelectedPackage = useSubscriptionStore(
    (s) => s.purchaseSelectedPackage,
  );
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const refreshCustomerInfo = useSubscriptionStore(
    (s) => s.refreshCustomerInfo,
  );
  const initSubscription = useSubscriptionStore((s) => s.initSubscription);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    loadOfferings().catch(() => undefined);
  }, [loadOfferings]);

  if (!__DEV__) {
    return null;
  }

  const onPurchase = async () => {
    try {
      await purchaseSelectedPackage();
      Alert.alert("Success", "Purchase completed.");
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e?.userCancelled) Alert.alert("Error", e?.message ?? "Purchase failed");
    }
  };

  const onRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert("Success", "Purchases restored.");
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error)?.message ?? "Restore failed");
    }
  };

  const onRefresh = async () => {
    await refreshCustomerInfo();
    await loadOfferings();
  };

  const hasKey = Boolean(RevenueCatConfig.apiKey?.trim());

  if (!hasKey) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>RevenueCat</Text>
        <Text style={styles.hint}>Set EXPO_PUBLIC_REVENUECAT_API_KEY in .env</Text>
      </View>
    );
  }

  if (isLoading && !offerings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading...</Text>
      </View>
    );
  }

  if (errorMessage && !offerings) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <TouchableOpacity style={styles.btn} onPress={onRefresh}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const packages = offerings?.availablePackages ?? [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>RevenueCat (dev)</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Pro</Text>
        <Text style={styles.value}>{isPro ? "Active" : "Inactive"}</Text>
      </View>

      {packages.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packages</Text>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={styles.pkg}
              onPress={() => {
                setSelectedPackageId(pkg.identifier);
              }}
              disabled={isPro}>
              <Text style={styles.pkgTitle}>{pkg.title}</Text>
              <Text style={styles.pkgPrice}>{pkg.priceString}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>No packages available</Text>
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={() => {
          initSubscription().catch(() => undefined);
        }}>
        <Text style={styles.btnText}>Sync customer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => {
          void onPurchase();
        }}
        disabled={isPro || !selectedPackageId}>
        <Text style={styles.btnText}>Purchase selected</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={onRestore}>
        <Text style={styles.btnText}>Restore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onRefresh}>
        <Text style={styles.btnTextSecondary}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  hint: { fontSize: 14, color: "#666", marginTop: 8 },
  error: { fontSize: 14, color: "#c00", textAlign: "center", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  label: { fontSize: 16, color: "#333" },
  value: { fontSize: 16, fontWeight: "600" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  pkg: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  pkgTitle: { fontSize: 16, fontWeight: "500" },
  pkgPrice: { fontSize: 16, fontWeight: "600" },
  btn: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  btnSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#2196F3" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnTextSecondary: { color: "#2196F3", fontSize: 16, fontWeight: "600" },
});
