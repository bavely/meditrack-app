// app/(auth)/signup.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/auth-store";
export default function SignupScreen() {
  const router = useRouter();
  const { isLoading, signup, isAuthenticated } = useAuthStore();
 const [submitLoading, setSubmitLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  setSubmitLoading(true);
    try {
      await signup(
        email,
        password,
        name,
        "",
        "user",
        "authenticated"
      );
     
        router.push("/(auth)/login");
   
    } catch (err: unknown) {
      let message = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
        message = err.message;
        if (err.message.includes('graphQLErrors')) {
          const parsedError = JSON.parse(err.message);
          if (parsedError.graphQLErrors && parsedError.graphQLErrors.length > 0) {
            message = parsedError.graphQLErrors[0].message;
          }
        }
      }
      Alert.alert('Sign Up Failed', message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <TextInput
        placeholder="Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Sign Up" onPress={handleSignup} disabled={isLoading || submitLoading} />
      <Text style={styles.link} onPress={() => router.push("/(auth)/login")}>
        Already have an account? Log in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  link: { marginTop: 16, color: "blue", textAlign: "center" },
});
