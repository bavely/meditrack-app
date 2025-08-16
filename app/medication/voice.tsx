import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useMicrophonePermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";


export default function MedicationVoiceScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isListening, setIsListening] = useState(false);

  const startListening = async () => {
    try {
      if (!micPermission?.granted) {
        const status = await requestMicPermission();
        if (!status.granted) {
          Alert.alert("Microphone permission required");
          return;
        }
      }
      setIsListening(true);
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: false,
      });
    } catch (error) {
      console.error("Voice start error:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
  };

  useSpeechRecognitionEvent("result", async (event) => {
    if (event.isFinal && event.results.length > 0) {
      const transcript = event.results[0].transcript;
      try {
        const res = await handleParsedText(transcript);
        if (res?.data?.parseMedicationLabel?.data) {
          setParsedMedication(res.data.parseMedicationLabel.data);
          router.push("/medication/confirmation");
        }
      } catch (err) {
        console.log("Speech processing error:", err);
      } finally {
        setIsListening(false);
        ExpoSpeechRecognitionModule.stop();
      }
    }
  });

  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isListening && (
          <View style={styles.indicator}>
            <ActivityIndicator color={Colors[colorScheme].tint} />
            <Text style={styles.indicatorText}>Listening...</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.micButton,
            pressed && { opacity: 0.7 },
          ]}
          onPressIn={startListening}
          onPressOut={stopListening}
        >
          <Ionicons
            name="mic"
            size={32}
            color={Colors[colorScheme].foreground}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  indicator: ViewStyle;
  indicatorText: TextStyle;
  message: TextStyle;
  micButton: ViewStyle;
};

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create<Styles>({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      alignItems: "center",
      gap: 20,
    },
    indicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    indicatorText: {
      color: Colors[colorScheme].text,
      fontSize: 16,
    },
    message: {
      color: Colors[colorScheme].text,
      fontSize: 16,
    },
    micButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}