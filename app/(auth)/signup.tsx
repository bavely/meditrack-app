import { ApolloError } from "@apollo/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback
} from "react-native";
import Button from "../../components/ui/Button";
import { createUser } from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [userMsg, setUserMsg] = useState({ type: "", message: "" });

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setUserMsg({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    if (!email || !password || !name) {
      setUserMsg({
        type: "error",
        message: "Please fill in all fields.",
      });
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await createUser({
        email,
        password,
        name,
        phoneNumber: "",
        role: "user",
        aud: "authenticated",
      });
      const { accessToken, refreshToken } = response.data.registerUser.data;

      if (
        !accessToken ||
        !refreshToken ||
        !response.data.registerUser.success
      ) {
        setUserMsg({
          type: "error",
          message: "Registration failed. Please try again.",
        });
        setSubmitLoading(false);
        return;
      }

      await signup(accessToken, refreshToken);
      setSubmitLoading(false);
      setUserMsg({
        type: "warning",
        message:
          "Your account has been created. Please check your email for a verification link to be able to sign in. You will be redirected to the login page in 5 seconds.",
      });

      setTimeout(() => {
        router.push("/(auth)/login");
      }, 5000);
    } catch (err) {
      if (err instanceof ApolloError && err.graphQLErrors.length > 0) {
        setUserMsg({
          type: "error",
          message: err.graphQLErrors[0].message,
        });
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {userMsg.type !== "" && (
            <Text
              className={`${
                userMsg.type === "success"
                  ? "text-[green]"
                  : userMsg.type === "error"
                  ? "text-[red]"
                  : "text-[orange]"
              }`}
            >
              {userMsg.message}
            </Text>
          )}
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
          <Button
            title="Sign Up"
            onPress={handleSignup}
            disabled={submitLoading}
            loading={submitLoading}
          />
          <Text style={styles.link} onPress={() => router.push("/(auth)/login")}>
            Already have an account? Log in
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  link: {
    marginTop: 16,
    color: "blue",
    textAlign: "center",
  },
});
