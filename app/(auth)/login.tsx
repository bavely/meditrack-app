import { useRouter } from "expo-router";
import { Bell, Pill, Shield } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Button from "../../components/ui/Button";
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../utils/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuthStore();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, router]);
  
  const handleLogin = async () => {
    await login();
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <Pill size={60} color={Colors.light.tint} />
        </View>
        <Text style={styles.appName}>MediTrack</Text>
        <Text style={styles.tagline}>Your medication, simplified</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Bell size={24} color={Colors.light.tint} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Timely Reminders</Text>
            <Text style={styles.featureDescription}>
              Never miss a dose with customizable medication reminders
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Pill size={24} color={Colors.light.tint} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Medication Tracking</Text>
            <Text style={styles.featureDescription}>
              Keep track of all your medications in one place
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Shield size={24} color={Colors.light.tint} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Secure & Private</Text>
            <Text style={styles.featureDescription}>
              Your health data is encrypted and protected
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.authContainer}>
        <Button
          title="Sign in with Auth0"
          onPress={handleLogin}
          style={styles.loginButton}
          size="large"
        />
        
        <Text style={styles.termsText}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.light.tint}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: "center",
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.tint}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  authContainer: {
    marginTop: "auto",
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: "center",
    lineHeight: 18,
  },
});