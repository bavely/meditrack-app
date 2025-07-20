import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ApolloError } from "@apollo/client";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { DatePickerInput, en, registerTranslation } from 'react-native-paper-dates';
import { Dropdown } from "react-native-paper-dropdown";
import { createUser } from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";
export default function SignupScreen() {
  registerTranslation('en', en);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { signup } = useAuthStore();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | undefined>(new Date());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userMsg, setUserMsg] = useState({ type: "", message: "" });
  const [gender, setGender] = useState("");
  const progressAnim = useRef(new Animated.Value(0)).current;
  const OPTIONS = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];
  const bgcolor =
    colorScheme === "light" ? Colors.light.background : Colors.dark.background;
  const textcolor =
    colorScheme === "light" ? Colors.light.text : Colors.dark.text;

      useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 0 && (!name.trim() || !email.trim())) {
      setUserMsg({ type: "error", message: "Name and Email are required." });
      return;
    }
    if (currentStep === 1 && (!dob || !phoneNumber.trim())) {
      setUserMsg({
        type: "error",
        message: "Age and Phone number are required.",
      });
      return;
    }
    if (currentStep === 2) {
      if (!password || !confirmPassword) {
        setUserMsg({
          type: "error",
          message: "Both password fields are required.",
        });
        return;
      }
      if (password !== confirmPassword) {
        setUserMsg({ type: "error", message: "Passwords do not match." });
        return;
      }
    }

    setUserMsg({ type: "", message: "" });
    setCurrentStep((prev) => prev + 1);
  };

  const handleSignup = async () => {
    setSubmitLoading(true);
    try {
      const response = await createUser({
        email,
        password,
        name,
        phoneNumber,
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
      setUserMsg({
        type: "warning",
        message:
          "Account created! Please verify your email. Redirecting to login in 5s...",
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
        setUserMsg({ type: "error", message: err.message });
      } else {
        setUserMsg({
          type: "error",
          message: "Unexpected error. Please try again.",
        });
      }
    }
    setSubmitLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="gap-2">
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Name"
              value={name}
              onChangeText={setName}
              outlineStyle ={{borderColor: 'gray', borderWidth: 2, padding: 20}}
            />
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(43,137,142, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 1:
        return (
          < View className="gap-2">
          
                    <DatePickerInput
          locale="en"
          label="Date of Birth"
          value={dob}
          onChange={(d) => setDob(d)}
          inputMode="start"
          style={{width: 200}}
          mode="outlined"
          keyboardType="numeric"
          activeOutlineColor="gray"
        />
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <Dropdown
              label="Gender"
              placeholder="Select Gender"
              options={OPTIONS}
              value={gender}
              onSelect={(value) => setGender(value ?? "")}
              mode="outlined"
            />

            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(43,137,142, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 2:
        return (
          <View className="gap-2">
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(43,137,142, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 3:
        return (
          <>
            <Text style={[styles.confirm, { color: textcolor }]}>Ready to create your account?</Text>
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(43,137,142, 1)" }}
              mode="contained"
              onPress={handleSignup}
              disabled={submitLoading}
              loading={submitLoading}
            >
              {" "}
              Sign Up
            </Button>
          </>
        );
      default:
        return null;
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
          contentContainerStyle={[
            styles.container,
            { backgroundColor: bgcolor },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {currentStep > 0 && currentStep < 4 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentStep((prev) => prev - 1)}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of 4
            </Text>
          </View>
          {/* <Text style={styles.title}>
            Sign Up — Step {currentStep + 1} of 4
          </Text> */}
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
          {renderStep()}
          <Text
            style={[styles.link, {color:textcolor}]}
            onPress={() => router.push("/(auth)/login")}
          >
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
    fontSize: 22,
    fontWeight: "600",
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
    marginTop: 20,
    textAlign: "center",
  },
  confirm: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#ECEDEE",
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgb(67, 170, 176)',
    borderRadius: 2,
    marginBottom: 8,
    borderColor: '#E3F2FD',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
  },
});
