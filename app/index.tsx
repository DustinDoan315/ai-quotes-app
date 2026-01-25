import RevenueCatTestScreen from '../components/RevenueCatTestScreen';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
    } from 'react-native';


export default function Index() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Quotes App</Text>
        <Text style={styles.subtitle}>RevenueCat Test</Text>
      </View>
      <RevenueCatTestScreen />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
