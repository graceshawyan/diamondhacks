import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the splash screen by default
  return <Redirect href="/splash" />;
}
