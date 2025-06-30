import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../utils/auth";

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { handleRedirect } = useAuthStore();
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // Reconstruct the full URL from params
        const url = `meditrack://callback?${new URLSearchParams(
          params as Record<string, string>
        ).toString()}`;
        
        // Process the authentication callback
        const success = await handleRedirect(url);
        
        // Redirect based on result
        if (success) {
          router.replace( "/(tabs)");
        } else {
          router.replace("/");
        }
      } catch (error) {
        console.error("Error processing callback:", error);
        router.replace("/");
      }
    };
    
    processAuth();
  }, [params, router, handleRedirect]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.tint} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  text: {
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 24,
  },
});