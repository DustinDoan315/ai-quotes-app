import { PurchasesPackage } from 'react-native-purchases';
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
    refreshCustomerInfo,
  } = useRevenueCat();

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg);
      Alert.alert('Success', 'Purchase completed successfully!');
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('Error', err.message || 'Failed to complete purchase');
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to restore purchases');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Loading RevenueCat...</Text>
      </View>
    );
  }

  const isApiKeyMissing = !RevenueCatConfig.apiKey || RevenueCatConfig.apiKey.trim() === '';
  
  if (isApiKeyMissing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ RevenueCat API Key Missing</Text>
          <Text style={styles.errorText}>
            To use RevenueCat, you need to set your API key.
          </Text>
          <Text style={styles.instructionsTitle}>Setup Instructions:</Text>
          <Text style={styles.instructions}>
            1. Get your API key from RevenueCat Dashboard{'\n'}
            2. Create a .env file in the root directory{'\n'}
            3. Add: EXPO_PUBLIC_REVENUECAT_API_KEY=your_key_here{'\n'}
            4. Or update config/revenuecat.ts directly{'\n'}
            5. Restart your development server
          </Text>
          <Text style={styles.note}>
            For testing, you can use the Test Store API key (starts with &apos;rcb_&apos;)
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (error) {
    const isSecretKeyError = error.message.includes('SECRET') || 
                            error.message.includes('sk_') ||
                            error.message.includes('rcsk_');
    const isApiKeyError = error.message.includes('API Key') || 
                         error.message.includes('not recognized') ||
                         error.message.includes('singleton instance') ||
                         isSecretKeyError;
    
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.errorContainer, isSecretKeyError && styles.secretKeyError]}>
          <Text style={styles.errorTitle}>
            {isSecretKeyError ? '❌ Secret API Key Detected' : 'Error'}
          </Text>
          <Text style={styles.errorText}>{error.message}</Text>
          {isSecretKeyError && (
            <>
              <Text style={styles.instructionsTitle}>How to Fix:</Text>
              <Text style={styles.instructions}>
                1. Go to RevenueCat Dashboard → Apps → Your App → API Keys{'\n'}
                2. Find the PUBLIC API key (NOT the secret key){'\n'}
                3. Copy the key that starts with:{'\n'}
                   • appl_... (for iOS){'\n'}
                   • goog_... (for Android){'\n'}
                   • rcb_... (for Test Store - recommended for testing){'\n'}
                4. Create/update .env file in project root:{'\n'}
                   EXPO_PUBLIC_REVENUECAT_API_KEY=your_public_key_here{'\n'}
                5. Restart your development server completely
              </Text>
              <Text style={styles.note}>
                ⚠️ Never use secret keys (sk_... or rcsk_...) in mobile apps!
              </Text>
            </>
          )}
          {isApiKeyError && !isSecretKeyError && (
            <>
              <Text style={styles.instructionsTitle}>Possible Solutions:</Text>
              <Text style={styles.instructions}>
                1. Verify your API key is correct{'\n'}
                2. Check the key format (appl_..., goog_..., or rcb_...){'\n'}
                3. Ensure the key matches your app platform{'\n'}
                4. Restart your development server after setting the key
              </Text>
            </>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={refreshCustomerInfo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Subscription Test</Text>
        <Text style={styles.subtitle}>Test your RevenueCat integration</Text>
      </View>
      
      <View style={[styles.statusCard, isPremium && styles.premiumCard]}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusLabel}>Premium Status</Text>
          <View style={[styles.statusBadge, isPremium && styles.premiumBadge]}>
            <Text style={[styles.statusBadgeText, isPremium && styles.premiumBadgeText]}>
              {isPremium ? '✓ Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        {isPremium && (
          <Text style={styles.premiumMessage}>
            🎉 You have access to all premium features!
          </Text>
        )}
      </View>

      {currentOffering && currentOffering.availablePackages.length > 0 ? (
        <View style={styles.packagesContainer}>
          <Text style={styles.sectionTitle}>Available Subscriptions</Text>
          {currentOffering.availablePackages.map((pkg) => {
            const product = pkg.product;
            const isPopular = pkg.identifier.includes('annual') || pkg.identifier.includes('yearly');
            return (
              <View key={pkg.identifier} style={[styles.packageCard, isPopular && styles.popularCard]}>
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.packageHeader}>
                  <Text style={styles.packageTitle}>{product.title}</Text>
                  <Text style={styles.packagePrice}>{product.priceString}</Text>
                </View>
                {product.description && (
                  <Text style={styles.packageDescription}>
                    {product.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.purchaseButton, isPremium && styles.purchaseButtonDisabled]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={isPremium}
                >
                  <Text style={styles.purchaseButtonText}>
                    {isPremium ? '✓ Already Active' : `Subscribe - ${product.priceString}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📦</Text>
          <Text style={styles.emptyStateText}>No packages available</Text>
          <Text style={styles.emptyStateSubtext}>
            Make sure your StoreKit Configuration is set up in Xcode
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshCustomerInfo}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRestore}>
          <Text style={styles.actionButtonText}>🔄 Restore Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={refreshCustomerInfo}>
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Test Store Info</Text>
        <Text style={styles.infoText}>
          This is a Test Store environment. Purchases won&apos;t charge real money.
          Perfect for testing your subscription flow!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  premiumCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  premiumBadge: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  premiumBadgeText: {
    color: '#fff',
  },
  premiumMessage: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  packagesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f7ff',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2196F3',
    marginLeft: 12,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#4CAF50',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 15,
    lineHeight: 22,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginTop: 10,
    marginBottom: 5,
  },
  instructions: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  note: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
    marginTop: 10,
  },
  secretKeyError: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

