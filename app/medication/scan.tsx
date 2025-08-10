import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  Info,
  Play,
  Square,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
import MlkitOcr from "react-native-mlkit-ocr";
import Svg, { Circle } from "react-native-svg";
import { CylindricalGuidanceOverlay } from "../../components/CylindricalGuidanceOverlay";
import Button from "../../components/ui/Button";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";
import {
  AlternativeScanningManager,
  cleanupAlternativeScanFiles,
} from "../../utils/alternativeScanning";
import {
  RotationTracker,
  analyzeFrameForBottle,
  generateScanningFeedback,
  type BottleDetectionResult,
  type ScanningMetrics
} from "../../utils/bottleDetection";
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
  const [showGuidance, setShowGuidance] = useState(true);
  const [bottleDetection, setBottleDetection] = useState<BottleDetectionResult | null>(null);
  const [scanningMetrics, setScanningMetrics] = useState<ScanningMetrics>({
    frameCount: 0,
    rotationCoverage: 0,
    qualityScore: 0,
    estimatedCompleteness: 0,
  });
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const rotationTracker = useRef(new RotationTracker()).current;
  const frameAnalysisInterval = useRef<number | null>(null);
  const alternativeScanner = useRef(new AlternativeScanningManager()).current;
 const isAnalyzingFrame = useRef(false);
  useEffect(() => {
    // Start frame analysis when camera is ready
    if (permission?.granted && !isProcessing) {
      startFrameAnalysis();
    }

    return () => {
      if (frameAnalysisInterval.current) {
        clearInterval(frameAnalysisInterval.current);
      }
    };
  }, [permission?.granted, isProcessing]); // Removed startFrameAnalysis dependency to avoid warnings

  useEffect(() => {
    // Audio.requestRecordingPermissionsAsync();
  }, []);

  const startFrameAnalysis = () => {
    if (isRecording) return;
    frameAnalysisInterval.current = setInterval(async () => {
      if (
        cameraRef.current &&
        !isProcessing &&
        !isAnalyzingFrame.current
      ) {
        isAnalyzingFrame.current = true;
        try {
          const photo = await cameraRef.current.takePictureAsync({
            skipProcessing: true,
          });
          if (photo?.uri) {
            const detection = await analyzeFrameForBottle(
              photo.uri,
              photo.width ?? screenWidth,
              photo.height ?? screenHeight
            );
            setBottleDetection(detection);
          }
        } catch (error) {
          console.log('Frame analysis error:', error);
        } finally {
          isAnalyzingFrame.current = false;
        }
      }
    }, 500); // Analyze every 500ms
  };

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

  const handleAlternativeScan = async (
    method: 'photo_stitching' | 'single_photo' | 'manual_guide' | 'auto' = 'auto'
  ) => {
    let result;
    try {
      setIsProcessing(true);
      setShowFallbackOptions(false);
      result = await alternativeScanner.performAlternativeScan(method);
      if (result.success && result.extractedText) {
        const res = await handleParsedText(result.extractedText);
        if (
          res &&
          res.data &&
          res.data.parseMedicationLabel &&
          res.data.parseMedicationLabel.data
        ) {
          await navigateToConfirmation(res.data.parseMedicationLabel.data);
        } else {
          setShowFallbackOptions(true);
        }
      } else {
        setShowFallbackOptions(true);
      }
    } catch (err) {
      console.error('Alternative scanning error:', err);
      setShowFallbackOptions(true);
    } finally {
      if (result) {
        await cleanupAlternativeScanFiles(result);
      }
      setIsProcessing(false);
    }
  };

  const processVideo = async (uri: string) => {
    console.log("Processing video URI:", uri);
    let flattenedUri: string | null = null;
    try {
      setIsProcessing(true);
      flattenedUri = await unwrapCylindricalLabel(uri);
      const recognized = await MlkitOcr.detectFromUri(flattenedUri);
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
      await handleAlternativeScan('auto');
    } finally {
      try {
        if (flattenedUri) {
          await FileSystem.deleteAsync(flattenedUri, { idempotent: true });
        }
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn("Failed to delete temp files:", cleanupError);
      }
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing || !cameraRef.current) return;

    setIsRecording(true);
    setRotationProgress(0);
    progressAnimation.setValue(0);
    rotationTracker.startTracking();

    if (frameAnalysisInterval.current) {
      clearInterval(frameAnalysisInterval.current);
      frameAnalysisInterval.current = null;
    }
    
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
   
      // Update rotation tracking
      if (bottleDetection?.isBottleDetected) {
        rotationTracker.addFrame(bottleDetection.position);
        const metrics = rotationTracker.getScanningMetrics();
        setScanningMetrics(metrics);
      }
      
      if (milestoneIndex < milestones.length && value >= milestones[milestoneIndex]) {
        Haptics.selectionAsync();
        Speech.speak(`${milestones[milestoneIndex] * 100} percent`);
        milestoneIndex++;
      }
    });

    try {
       // @ts-ignore: stopRecording may not be typed on cameraRef
      const video = await cameraRef.current.recordAsync({
        maxDuration: duration / 1000,
        
      });
      console.log("Recorded video:", video);
      if (!video?.uri) {
        throw new Error("No video URI returned from recording");
      }
      console.log("Video URI:==========================================>", video.uri);
      await processVideo(video.uri);
    } catch (error) {
      console.error("Recording error:", error);
      handleNavigationError(error);
    } finally {
      progressAnimation.removeListener(listener);
      setIsRecording(false);
      rotationTracker.reset();
      startFrameAnalysis();
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current) return;
    // @ts-ignore: stopRecording may not be typed on cameraRef
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

  const toggleGuidance = () => {
    setShowGuidance((prev) => !prev);
  };

  // Generate real-time feedback
  const feedback = bottleDetection 
    ? generateScanningFeedback(bottleDetection, scanningMetrics, isRecording)
    : null;

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
      ></CameraView>
       <View> {/* Enhanced Guidance Overlay */}
        {showGuidance && (
          <CylindricalGuidanceOverlay
            isRecording={isRecording}
            rotationProgress={rotationProgress}
            colorScheme={colorScheme}
          />
        )}

        {/* Real-time feedback */}
        {feedback && !isRecording && (
          <View style={[
            styles.feedbackContainer,
            { backgroundColor: getFeedbackColor(feedback.status) }
          ]}>
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        )}

        {/* Progress ring for recording */}
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

        <TouchableOpacity style={styles.guidanceButton} onPress={toggleGuidance}>
          <Info size={20} color={showGuidance ? "#00FF88" : "#FFFFFF"} />
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

        {/* Quality metrics during recording */}
        {isRecording && scanningMetrics.qualityScore > 0 && (
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsText}>
              Quality: {scanningMetrics.qualityScore}% | Coverage: {Math.round(scanningMetrics.rotationCoverage)}%
            </Text>
          </View>
        )}</View>
      

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={Colors[colorScheme].tint} size="large" />
            <Text style={styles.processingText}>
              Processing captured video...
            </Text>
            <Text style={styles.processingSubtext}>
              Unwrapping cylindrical label and extracting text
            </Text>
          </View>
        </View>
      )}

      {showFallbackOptions && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <Text style={styles.processingText}>Scanning failed</Text>
            <Text style={styles.processingSubtext}>Choose an option</Text>
            <Button
              title="Retry Auto Scan"
              onPress={() => handleAlternativeScan('auto')}
              style={styles.fallbackButton}
            />
            <Button
              title="Photo Stitching"
              variant="secondary"
              onPress={() => handleAlternativeScan('photo_stitching')}
              style={styles.fallbackButton}
            />
            <Button
              title="Single Photo"
              variant="secondary"
              onPress={() => handleAlternativeScan('single_photo')}
              style={styles.fallbackButton}
            />
            <Button
              title="Manual Guidance"
              variant="secondary"
              onPress={() => handleAlternativeScan('manual_guide')}
              style={styles.fallbackButton}
            />
            <Button
              title="Manual Entry"
              variant="outline"
              onPress={() => router.push('/medication/manually')}
              style={styles.fallbackButton}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );

  function getFeedbackColor(status: string): string {
    switch (status) {
      case 'excellent': return 'rgba(0, 255, 136, 0.9)';
      case 'good': return 'rgba(255, 215, 0, 0.9)';
      case 'poor': return 'rgba(255, 165, 0, 0.9)';
      case 'error': return 'rgba(255, 69, 58, 0.9)';
      default: return 'rgba(0, 0, 0, 0.7)';
    }
  }
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
    feedbackContainer: {
      position: "absolute",
      top: 80,
      left: 20,
      right: 20,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    feedbackText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    metricsContainer: {
      position: "absolute",
      top: 130,
      left: 20,
      right: 20,
      alignItems: 'center',
    },
    metricsText: {
      color: '#FFFFFF',
      fontSize: 12,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
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
    guidanceButton: {
      position: "absolute",
      top: 40,
      right: 70,
      zIndex: 2,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
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
      maxWidth: "80%",
    },
    processingText: {
      marginTop: 10,
      color: Colors[colorScheme].foreground,
      textAlign: "center",
      fontSize: 16,
      fontWeight: '600',
    },
    processingSubtext: {
      marginTop: 8,
      color: Colors[colorScheme].foreground,
      textAlign: "center",
      fontSize: 12,
      opacity: 0.7,
    },
    fallbackButton: {
      marginTop: 8,
      width: '100%',
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
