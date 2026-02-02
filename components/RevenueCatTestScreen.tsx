import type { PurchasesPackage } from 'react-native-purchases';
import { RevenueCatConfig } from '../config/revenuecat';
import { useRevenueCat } from '../hooks/useRevenueCat';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RevenueCatTestScreen() {
  const {
    currentOffering,
    isLoading,
    isPremium,
    error,
    purchasePackage,
    restorePurchases,
    refresh,
  } = useRevenueCat();

  const onPurchase = async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg);
      Alert.alert('Success', 'Purchase completed.');
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e?.userCancelled) Alert.alert('Error', e?.message ?? 'Purchase failed');
    }
  };

  const onRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored.');
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error)?.message ?? 'Restore failed');
    }
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error.message}</Text>
        <TouchableOpacity style={styles.btn} onPress={refresh}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>RevenueCat</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Premium</Text>
        <Text style={styles.value}>{isPremium ? 'Active' : 'Inactive'}</Text>
      </View>

      {currentOffering && currentOffering.availablePackages.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packages</Text>
          {currentOffering.availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={styles.pkg}
              onPress={() => onPurchase(pkg)}
              disabled={isPremium}
            >
              <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
              <Text style={styles.pkgPrice}>{pkg.product.priceString}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>No packages available</Text>
      )}

      <TouchableOpacity style={styles.btn} onPress={onRestore}>
        <Text style={styles.btnText}>Restore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={refresh}>
        <Text style={styles.btnTextSecondary}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  hint: { fontSize: 14, color: '#666', marginTop: 8 },
  error: { fontSize: 14, color: '#c00', textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  label: { fontSize: 16, color: '#333' },
  value: { fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  pkg: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  pkgTitle: { fontSize: 16, fontWeight: '500' },
  pkgPrice: { fontSize: 16, fontWeight: '600' },
  btn: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2196F3' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnTextSecondary: { color: '#2196F3', fontSize: 16, fontWeight: '600' },
});
