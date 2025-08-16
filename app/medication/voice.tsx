import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RecordingIndicator from "../../components/RecordingIndicator";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";

/*
 * This component provides a polished voice‑input experience for the
 * medication workflow. Users can record their voice, preview the
 * audio, view the recognised transcript, and submit it for
 * processing. Several issues present in the original implementation
 * have been addressed:
 *
 *   • Microphone permissions are requested via `expo‑av` rather than
 *     `expo-camera`’s `useMicrophonePermissions`. This avoids a
 *     dependency on the camera package and uses the correct audio
 *     permission API.
 *   • The start/stop logic has been simplified. There is now a
 *     single record button that toggles between recording and
 *     idle states. Holding down a mic icon (which previously
 *     triggered separate callbacks) caused multiple overlapping
 *     recordings; this has been removed.
 *   • The transcript is displayed to the user once available, and
 *     a loading indicator is shown while submission is in progress.
 *   • Playback controls now update their icons appropriately and
 *     unload the `Audio.Sound` object when no longer needed, which
 *     prevents memory leaks.
 *   • Layout and styling have been refined to create a more
 *     attractive, intuitive interface while relying only on
 *     properties defined in the existing `Colors` constant.
 */

export default function MedicationVoiceScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();

  // Local state for recording, playback and speech recognition
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Request permission to access the microphone. This helper
   * encapsulates the logic for checking and requesting permissions
   * from expo‑av. It returns `true` if the permission is granted,
   * otherwise it shows an alert and returns `false`.
   */
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const current = await Audio.getPermissionsAsync();
      if (current.granted) return true;
      const status = await Audio.requestPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Microphone permission required");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      Alert.alert("Could not request microphone permission");
      return false;
    }
  };

  /**
   * Start a new recording and speech recognition session. If the
   * microphone permission is not granted the function aborts
   * gracefully. When recording starts, a high‑quality audio
   * recording is created and speech recognition begins. Any
   * previous recording is cleared.
   */
  const startListening = async () => {
    if (!(await requestMicrophonePermission())) {
      return;
    }
    setRecordedUri(null);
    setTranscript("");
    setHasPlayed(false);
    try {
      // Configure the audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS:  InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
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

  /**
   * Stop the active recording and speech recognition. The recorded
   * audio URI is saved for playback. Errors are caught and logged
   * without crashing the app.
   */
  const stopListening = async () => {
    setIsListening(false);
    ExpoSpeechRecognitionModule.stop();
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecordedUri(recording.getURI());
      } catch (err) {
        console.error("Recording stop error:", err);
      }
      setRecording(null);
    }
  };

  /**
   * Handle speech recognition results. When the final result is
   * received the transcript state is updated and the listening
   * indicator is stopped. The recognition session is also
   * terminated by calling `ExpoSpeechRecognitionModule.stop()`.
   */
  useSpeechRecognitionEvent("result", (event) => {
    if (event.isFinal && event.results.length > 0) {
      setTranscript(event.results[0].transcript.trim());
      setIsListening(false);
      ExpoSpeechRecognitionModule.stop();
    }
  });

  // Stop the listening indicator on errors
  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  /**
   * Play or pause the recorded audio. When the audio finishes
   * playback the state is updated to reflect that it has stopped.
   */
  const playRecording = async () => {
    if (!recordedUri) return;
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
        await newSound.playAsync();
        setIsPlaying(true);
        setHasPlayed(true);
      } else if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  /**
   * Submit the transcript for further processing. A loading
   * indicator is displayed while waiting for the service to
   * complete. Once successful, the parsed medication data is
   * stored in the global medication store and the user is
   * navigated to the confirmation screen. Any errors encountered
   * are logged and an alert is shown if parsing fails.
   */
  const handleSubmit = async () => {
    if (!transcript || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await handleParsedText(transcript);
      setIsProcessing(false);
      if (res?.data?.parseMedicationLabel?.data) {
        setParsedMedication(res.data.parseMedicationLabel.data);
        router.push("/medication/confirmation");
      } else {
        Alert.alert("Unable to parse medication. Please try again.");
      }
    } catch (err) {
      console.error("Speech processing error:", err);
      setIsProcessing(false);
      Alert.alert("An error occurred while processing your request");
    }
  };

  /**
   * Reset the component state in order to record again. This
   * unloads any active sound and clears the transcript.
   */
  const reRecord = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (err) {
      console.error("Unload sound error:", err);
    }
    setRecordedUri(null);
    setTranscript("");
    setHasPlayed(false);
  };

  // Clean up the sound and speech recognition module when the
  // component is unmounted or when the sound instance changes.
  useEffect(() => {
    return () => {
      sound?.unloadAsync();
      ExpoSpeechRecognitionModule.stop();
    };
  }, [sound]);

  /**
   * Render the UI. The layout adjusts based on whether the user is
   * currently listening, has a recording to play back, or is idle.
   * A transcript preview is shown when available and the submit
   * button is disabled until the recording has been played at
   * least once.
   */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Listening indicator */}
        {isListening && (
          <View style={styles.indicator}>
            <ActivityIndicator color={Colors[colorScheme].tint} />
            <RecordingIndicator active />
            <Text style={styles.indicatorText}>Listening…</Text>
          </View>
        )}

        {/* Transcript display */}
        {transcript ? (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>Transcript:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}

        {/* Playback and submission controls */}
        {recordedUri && !isListening && (
          <View style={styles.controlsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.circularButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={playRecording}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color={Colors[colorScheme].background}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.circularButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              disabled={!hasPlayed || isProcessing}
              onPress={handleSubmit}
            >
              {isProcessing ? (
                <ActivityIndicator color={Colors[colorScheme].background} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={32}
                  color={Colors[colorScheme].background}
                />
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.circularButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={reRecord}
            >
              <Ionicons
                name="reload"
                size={32}
                color={Colors[colorScheme].background}
              />
            </Pressable>
          </View>
        )}

        {/* Record/Stop button */}
        {!recordedUri && !isListening && (
          <Pressable
            style={({ pressed }) => [
              styles.recordButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={startListening}
          >
            <Ionicons
              name="mic"
              size={40}
              color={Colors[colorScheme].background}
            />
          </Pressable>
        )}
        {isListening && (
          <Pressable
            style={({ pressed }) => [
              styles.recordButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={stopListening}
          >
            <Ionicons
              name="square"
              size={32}
              color={Colors[colorScheme].background}
            />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// TypeScript note: we avoid referencing colour keys that are not part
// of the provided `Colors` constant. If additional keys exist (such
// as `card` or `muted`), they can be added to the styles below.

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      width: "100%",
      alignItems: "center",
      gap: 24,
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
    controlsRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 16,
    },
    circularButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
    recordButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
    transcriptContainer: {
      width: "100%",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
      padding: 16,
      backgroundColor: Colors[colorScheme].background,
    },
    transcriptLabel: {
      fontWeight: "600",
      marginBottom: 4,
      color: Colors[colorScheme].tint,
    },
    transcriptText: {
      color: Colors[colorScheme].text,
      fontSize: 14,
    },
  });
}