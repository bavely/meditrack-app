import { useColorScheme } from '@/hooks/useColorScheme';
import { ApolloProvider } from '@apollo/client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import "../global.css";
import { useAuthStore } from "../store/auth-store";
import { apolloClient } from '../utils/apollo';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, user} = useAuthStore();
  

  

  return (
     <ApolloProvider client={apolloClient}>
       <PaperProvider>
 <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        { isAuthenticated ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="(auth)" options={{ headerShown: false }} />}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
</ThemeProvider>
      </PaperProvider>
    </ApolloProvider>
  );
}
