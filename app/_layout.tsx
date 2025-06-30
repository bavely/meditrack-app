import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from "react-native";
import 'react-native-reanimated';
import "../global.css";
import { useAuthStore } from "../utils/auth";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
console.log("RootLayout isAuthenticated:", isAuthenticated);
  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }
if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: colorScheme === 'dark' ? '#fff' : '#000' }}>
        Loading...
      </Text>
    </View>
  )
}
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        { isAuthenticated ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="(auth)" options={{ headerShown: false }} />}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
