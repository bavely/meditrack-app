// app/(auth)/login.tsx
import { ApolloError } from "@apollo/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/ui/Button";
import { loginUser } from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";
export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [userMsg, setUserMsg] = useState({ type: "", message: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleLogin = async () => {
    setSubmitLoading(true);
    if (!email.trim() || !password) {
      setUserMsg({ type: "error", message: "Please fill in all fields." });
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await loginUser(email, password);
      console.log("Login response:", response);
      const { accessToken, refreshToken } = response.data.login.data;
      console.log(
        "Login response:",
        accessToken,
        "====================================and==============================",
        refreshToken
      );
      if (!accessToken || !refreshToken || !response.data.login.success) {
        setUserMsg({
          type: "error",
          message: "Login failed. Please try again.",
        });
        setSubmitLoading(false);
        return;
      }
      await login(accessToken, refreshToken);
      setUserMsg({ type: "success", message: "Login successful!" });
      setSubmitLoading(false);

      router.push("/(tabs)");
    } catch (err) {
      if (err instanceof ApolloError) {
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          setUserMsg({
            type: "error",
            message: err.graphQLErrors[0].message,
          });
        }
      } else if (err instanceof Error) {
        setUserMsg({
          type: "error",
          message: err.message,
        });
      } else {
        setUserMsg({
          type: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      }
      setSubmitLoading(false);
    }
  };
  console.log("userMsg:", userMsg);
  return (
    <View style={styles.container}>
      {userMsg.type !== "" && (
        <Text
          className={`${userMsg.type === "success" ? "text-[green]" : "text-[red]"}`}
        >
          {userMsg.message}
        </Text>
      )}
      <Text style={styles.title}>Welcome back</Text>
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
      <Button title="Login" onPress={handleLogin} disabled={submitLoading} />
      <Text style={styles.link} onPress={() => router.push("/(auth)/signup")}>
        Don&apos;t have an account? Sign up
      </Text>
      <Text
        style={styles.link}
        onPress={() => router.push("/(auth)/forgot-password")}
      >
        Forgot password?
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
