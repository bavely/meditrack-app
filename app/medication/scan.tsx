import { Colors } from "@/constants/Colors";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  Play,
  Square,
  X,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import MlkitOcr from "react-native-mlkit-ocr";
import Button from "../../components/ui/Button";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";
import { useColorScheme } from "@/hooks/useColorScheme";
import { unwrapCylindricalLabel } from "../../utils/cylindricalUnwrap";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScanMedicationScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);

  const cameraRef = useRef<CameraView | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const navigateToConfirmation = async (medicationData: any) => {
    try {
      if (medicationData) {
        setParsedMedication(medicationData);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/medication/confirmation");
    } catch {
      router.push("/medication/add");
    }
  };

  const handleNavigationError = (error: any) => {
    console.log("🧠 Parsed Text Error:", JSON.stringify(error));
    setIsProcessing(false);
    router.push("/medication/add");
  };

  const processVideo = async (uri: string) => {
    try {
      setIsProcessing(true);
      const flattened = await unwrapCylindricalLabel(uri);
      const recognized = await MlkitOcr.detectFromFile(flattened);
      const labelText = recognized
        .map((block) => block.text)
        .join("\n")
        .trim();
      const res = await handleParsedText(labelText);
      if (
        res &&
        res.data &&
        res.data.parseMedicationLabel &&
        res.data.parseMedicationLabel.data
      ) {
        await navigateToConfirmation(res.data.parseMedicationLabel.data);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Processing error:", error);
      handleNavigationError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing || !cameraRef.current) return;
    setIsRecording(true);
    setRotationProgress(0);
    progressAnimation.setValue(0);
    const duration = 6000;
    const milestones = [0.25, 0.5, 0.75, 1];
    let milestoneIndex = 0;

    Animated.timing(progressAnimation, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = progressAnimation.addListener(({ value }) => {
      const progress = value * 100;
      setRotationProgress(progress);
      if (milestoneIndex < milestones.length && value >= milestones[milestoneIndex]) {
        Haptics.selectionAsync();
        Speech.speak(`${milestones[milestoneIndex] * 100} percent`);
        milestoneIndex++;
      }
    });

    try {
      // @ts-expect-error
      const video = await cameraRef.current.recordAsync({
        maxDuration: duration / 1000,
        quality: "720p",
        mute: false,
      });
      await processVideo(video.uri);
    } catch (error) {
      console.error("Recording error:", error);
      handleNavigationError(error);
    } finally {
      progressAnimation.removeListener(listener);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current) return;
    // @ts-expect-error
    cameraRef.current.stopRecording();
  };

  const toggleCameraFacing = () => {
    setFacing((current: CameraType) =>
      current === "back" ? "front" : "back"
    );
  };

  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to scan your medication labels.
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        flash={flashEnabled ? "on" : "off"}
        focusable
      >
        {isRecording && (
          <View style={styles.progressRingWrapper}>
            <CircularProgress progress={rotationProgress} />
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          {flashEnabled ? (
            <Flashlight size={24} color="#FFD700" />
          ) : (
            <FlashlightOff size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Camera size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.disabledButton,
              isRecording && styles.stopButton,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <Square size={30} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={30} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </CameraView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={Colors[colorScheme].tint} size="large" />
            <Text style={styles.processingText}>
              Processing captured video...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke="rgba(255,255,255,0.2)"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke="#00FF88"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    camera: {
      flex: 1,
    },
    progressRingWrapper: {
      position: "absolute",
      top: screenHeight * 0.15,
      left: (screenWidth - 80) / 2,
    },
    controls: {
      position: "absolute",
      bottom: 40,
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    stopButton: {
      backgroundColor: "#FF0000",
    },
    disabledButton: {
      opacity: 0.5,
    },
    flipButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderButton: {
      width: 60,
      height: 60,
    },
    closeButton: {
      position: "absolute",
      top: 40,
      left: 20,
      zIndex: 2,
    },
    flashButton: {
      position: "absolute",
      top: 40,
      right: 20,
      zIndex: 2,
    },
    processingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    processingCard: {
      backgroundColor: "#1E1E1E",
      padding: 20,
      borderRadius: 8,
      alignItems: "center",
    },
    processingText: {
      marginTop: 10,
      color: Colors[colorScheme].foreground,
      textAlign: "center",
    },
    permissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    permissionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
      color: Colors[colorScheme].foreground,
    },
    permissionText: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
      color: Colors[colorScheme].foreground,
    },
    permissionButton: {
      width: 200,
    },
  });
}
