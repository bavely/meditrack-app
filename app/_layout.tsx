import { useColorScheme } from '@/hooks/useColorScheme';
import { ApolloProvider } from '@apollo/client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from "react-native";
import 'react-native-reanimated';
import "../global.css";
import { useAuthStore } from "../store/auth-store";
import { apolloClient } from '../utils/apollo';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, user} = useAuthStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
 


  if (!loaded) {
     return (
     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       <ActivityIndicator size="large" />
     </View>
   );
  }
  

  return (
     <ApolloProvider client={apolloClient}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
        { isAuthenticated ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="(auth)" options={{ headerShown: false }} />}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </ApolloProvider>
  );
}
