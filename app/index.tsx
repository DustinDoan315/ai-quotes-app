import { Redirect } from 'expo-router';
import { useUserStore } from '@/appState/userStore';

export default function Index() {
  const { persona } = useUserStore();

  if (persona) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)" />;
}
