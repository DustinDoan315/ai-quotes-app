import '@/i18n';
import { useAppBootstrap } from "@/bootstrap/useAppBootstrap";
import { ToastHost } from '@/components/ToastHost';
import { GlobalHomeBackground } from '@/features/home/GlobalHomeBackground';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import '../global.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          <Text style={{ color: '#fff', textAlign: 'center', paddingHorizontal: 24 }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "transparent",
    card: "transparent",
  },
};


export default function RootLayout() {
  useAppBootstrap();

  return (
    <RootErrorBoundary>
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <View style={styles.root}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, styles.bgLayer]}>
              <GlobalHomeBackground />
            </View>
            <View style={styles.stackLayer}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
            </View>
            <ToastHost />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgLayer: { zIndex: 0 },
  stackLayer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
