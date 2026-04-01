import { useAppBootstrap } from "@/bootstrap/useAppBootstrap";
import { ToastHost } from '@/components/ToastHost';
import { GlobalHomeBackground } from '@/features/home/GlobalHomeBackground';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import '../global.css';

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
