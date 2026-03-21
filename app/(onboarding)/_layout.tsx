import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}>
      <Stack.Screen name="index" options={{ title: "Onboarding" }} />
    </Stack>
  );
}
