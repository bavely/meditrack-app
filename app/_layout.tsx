import { useColorScheme } from '@/hooks/useColorScheme';
import { ApolloProvider } from '@apollo/client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from "react-native";
import 'react-native-reanimated';
import "../global.css";
import { useAuthStore } from "../store/auth-store";
import { apolloClient } from '../utils/apollo';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading , user} = useAuthStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  useEffect(() => {
    console.log("RootLayout useEffect isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      // Initialize auth state if not authenticated
      console.log("User is not authenticated, initializing auth state.", user);
    }
  }, [isAuthenticated]);

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
     <ApolloProvider client={apolloClient}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        { isAuthenticated ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="(auth)" options={{ headerShown: false }} />}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </ApolloProvider>
  );
}
