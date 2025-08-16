import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Audio } from "expo-av";
import { useMicrophonePermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useEffect, useState } from "react";




import {
  ActivityIndicator,
  Alert,
  Pressable, SafeAreaView, StyleSheet, Text, TextStyle, View, ViewStyle
} from "react-native";
import RecordingIndicator from "../../components/RecordingIndicator";
import Button from "../../components/ui/Button";

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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = async () => {
    try {
      if (!micPermission?.granted) {
        const status = await requestMicPermission();
        if (!status.granted) {
          Alert.alert("Microphone permission required");
          return;
        }
      }
      setRecordedUri(null);
      setTranscript("");
      setHasPlayed(false);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
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

  const stopListening = async () => {
    ExpoSpeechRecognitionModule.stop();
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecordedUri(recording.getURI());
      } catch (err) {
        console.log("Recording stop error:", err);
      }
    }
    setRecording(null);
    setIsListening(false);
  };

  useSpeechRecognitionEvent("result", (event) => {
    if (event.isFinal && event.results.length > 0) {
      setTranscript(event.results[0].transcript);
      setIsListening(false);
      ExpoSpeechRecognitionModule.stop();
    }
  });

  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  const togglePlayback = async () => {
    if (!recordedUri) return;
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);
      setHasPlayed(true);
    } else if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
      setHasPlayed(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await handleParsedText(transcript);
      if (res?.data?.parseMedicationLabel?.data) {
        setParsedMedication(res.data.parseMedicationLabel.data);
        router.push("/medication/confirmation");
      }
    } catch (err) {
      console.log("Speech processing error:", err);
    }
  };

  const reRecord = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setTranscript("");
    setHasPlayed(false);
  };

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {recordedUri ? (
          <>
            <Button
              title={isPlaying ? "Pause" : "Play"}
              onPress={togglePlayback}
              style={styles.micButton}
            />
            <Button
              title="Submit"
              onPress={handleSubmit}
              disabled={!hasPlayed}
              style={styles.micButton}
            />
            <Button title="Re-record" onPress={reRecord} style={styles.micButton} />
          </>
        ) : isListening ? (
          <>
            <View style={styles.indicator}>
              <ActivityIndicator color={Colors[colorScheme].tint} />
              <RecordingIndicator active={isListening} />
              <Text style={styles.indicatorText}>Listening...</Text>
            </View>
            <Button title="Stop" onPress={stopListening} style={styles.micButton} />
          </>
        ) : (
          <Button title="Start" onPress={startListening} style={styles.micButton} />

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
    }

  });
}