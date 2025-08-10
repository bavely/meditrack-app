import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from 'expo-media-library';
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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
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
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [recordingStarted, setRecordingStarted] = useState(false);
  const [canStopRecording, setCanStopRecording] = useState(false);
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
  
  // Refs
  const cameraRef = useRef<CameraView | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const rotationTracker = useRef(new RotationTracker()).current;
  const frameAnalysisInterval = useRef<number | null>(null);
  const alternativeScanner = useRef(new AlternativeScanningManager()).current;
  const isAnalyzingFrame = useRef(false);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComponentMounted = useRef(true);
  
  // Recording state management
  const [recordingState, setRecordingState] = useState<{
    isActive: boolean;
    startTime: number | null;
    promise: Promise<any> | null;
  }>({
    isActive: false,
    startTime: null,
    promise: null,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (frameAnalysisInterval.current) {
        clearInterval(frameAnalysisInterval.current);
      }
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
      // Stop any ongoing recording
      if (recordingState.isActive && cameraRef.current) {
        try {
          // @ts-ignore
          cameraRef.current.stopRecording();
        } catch (error) {
          console.log('Cleanup recording stop error:', error);
        }
      }
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState !== 'active' && recordingState.isActive) {
        // App is going to background, stop recording
        stopRecording();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [recordingState.isActive]);

  // Start frame analysis when camera is ready
  useEffect(() => {
    if (isCameraReady && permission?.granted && !isProcessing && !isRecording) {
      startFrameAnalysis();
    }

    return () => {
      if (frameAnalysisInterval.current) {
        clearInterval(frameAnalysisInterval.current);
        frameAnalysisInterval.current = null;
      }
    };
  }, [isCameraReady, permission?.granted, isProcessing, isRecording]);

  const startFrameAnalysis = useCallback(() => {
    if (isRecording || frameAnalysisInterval.current) return;
    
    frameAnalysisInterval.current = setInterval(async () => {
      if (
        cameraRef.current &&
        isCameraReady &&
        !isProcessing &&
        !isAnalyzingFrame.current &&
        !isRecording &&
        isComponentMounted.current
      ) {
        isAnalyzingFrame.current = true;
        try {
          const photo = await cameraRef.current.takePictureAsync({
            skipProcessing: true,
            shutterSound: false,
            quality: 0.1, // Low quality for analysis
          });
          if (photo?.uri && isComponentMounted.current) {
            const detection = await analyzeFrameForBottle(
              photo.uri,
              photo.width ?? screenWidth,
              photo.height ?? screenHeight
            );
            if (isComponentMounted.current) {
              setBottleDetection(detection);
            }
            // Clean up analysis image
            FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
          }
        } catch (error) {
          // Silently handle analysis errors
        } finally {
          isAnalyzingFrame.current = false;
        }
      }
    }, 1000); // Reduced frequency to 1 second
  }, [isCameraReady, isProcessing, isRecording]);

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
    const { status } = await MediaLibrary.requestPermissionsAsync();
if (status === 'granted') {
  const asset = await MediaLibrary.createAssetAsync(uri);
  await MediaLibrary.createAlbumAsync('Meditrack', asset, false);
  console.log('Saved to gallery');
}
    console.log("Processing video URI:", uri);
    let flattenedUri: string | null = null;
    try {
      // Check if file exists and has size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error("Video file is empty or doesn't exist");
      }
      
      console.log("Video file info:", fileInfo);
      setIsProcessing(true);
      flattenedUri = await unwrapCylindricalLabel(uri);
      console.log("Flattened label URI:", flattenedUri);
      const recognized = await MlkitOcr.detectFromUri(flattenedUri);
      console.log("OCR recognized text:", recognized);
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
    // Prevent multiple recording attempts
    if (isRecording || isProcessing || !cameraRef.current || !isCameraReady || recordingState.isActive) {
      console.log('Recording blocked:', { isRecording, isProcessing, isCameraReady, recordingState });
      return;
    }

    // Check permissions
    if (!permission?.granted) {
      const camStatus = await requestPermission();
      if (!camStatus.granted) {
        Alert.alert("Camera permission required");
        return;
      }
    }

    if (!micPermission?.granted) {
      const micStatus = await requestMicPermission();
      if (!micStatus.granted) {
        Alert.alert("Microphone permission required");
        return;
      }
    }

    try {
      console.log('Starting recording...');
      
      // Set recording state
      setIsRecording(true);
      setRotationProgress(0);
      progressAnimation.setValue(0);
      rotationTracker.startTracking();
      setRecordingStarted(false);
      setCanStopRecording(false);

      // Stop frame analysis
      if (frameAnalysisInterval.current) {
        clearInterval(frameAnalysisInterval.current);
        frameAnalysisInterval.current = null;
      }

      const duration = 8000; // Increased to 8 seconds for better data capture
      const milestones = [0.25, 0.5, 0.75, 1];
      let milestoneIndex = 0;

      // Start progress animation
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

      // Enhanced recording options
      const recordingOptions = {
        maxDuration: duration / 1000, // Convert to seconds
        quality: "720p" as const, // Use 720p instead of 1080p for better compatibility
        fileType: "mp4" as const,
        videoBitrate: 5000000, // 5 Mbps
        fps: 30,
      };

      console.log('Recording options:', recordingOptions);

      let video: any = null;
      const startTime = Date.now();
      
      // Update recording state
      setRecordingState({
        isActive: true,
        startTime,
        promise: null,
      });

      try {
        // Start recording with timeout protection
        const recordingPromise =  cameraRef.current.recordAsync(recordingOptions);
        console.log('Recording started, waiting for promise...', recordingPromise);
        setRecordingState(prev => ({
          ...prev,
          promise: recordingPromise,
        }));

        setRecordingStarted(true);
        console.log('Recording started successfully', isComponentMounted.current);
        // Allow stopping after 1 second
        setTimeout(() => {
          if (isComponentMounted.current) {
            setCanStopRecording(true);
          }
        }, 1000);

        // Auto-stop recording after duration + buffer
        recordingTimeout.current = setTimeout(() => {
          if (recordingState.isActive && cameraRef.current) {
            console.log('Auto-stopping recording due to timeout');
            try {
              // @ts-ignore
              cameraRef.current.stopRecording();
            } catch (error) {
              console.log('Auto-stop error:', error);
            }
          }
        }, duration + 1000);

        console.log('Waiting for recording to complete...');
        video = await recordingPromise;
        console.log('Recording completed:', video);
        const recordingDuration = Date.now() - startTime;
        console.log('Recording completed:', { video, recordingDuration });

      } catch (error) {
        console.error("Recording failed:", error);
        
        // Check if it's a user cancellation vs actual error
        const recordingDuration = Date.now() - startTime;
        if (recordingDuration < 500) {
          throw new Error("Recording failed immediately - please try again");
        } else {
          throw error;
        }
      }

      // Process the recorded video
      if (video?.uri && isComponentMounted.current) {
        console.log("Processing recorded video:", video.uri);
        await processVideo(video.uri);
      } else {
        throw new Error("No video was recorded");
      }

      // Cleanup listener
      progressAnimation.removeListener(listener);

    } catch (error) {
      console.error("Recording error:", error);
      Alert.alert(
        "Recording Failed", 
        error instanceof Error ? error.message : "Please try again or use alternative scanning methods",
        [
          { text: "Try Again", onPress: () => {} },
          { text: "Alternative Methods", onPress: () => setShowFallbackOptions(true) }
        ]
      );
    } finally {
      // Reset all recording states
      setIsRecording(false);
      setRecordingStarted(false);
      setCanStopRecording(false);
      setRecordingState({
        isActive: false,
        startTime: null,
        promise: null,
      });
      
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }
      
      rotationTracker.reset();
      
      // Restart frame analysis
      if (isComponentMounted.current && isCameraReady) {
        setTimeout(() => {
          startFrameAnalysis();
        }, 1000);
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (!recordingState.isActive || !cameraRef.current || !canStopRecording) {
      console.log('Stop recording blocked:', { 
        isActive: recordingState.isActive, 
        canStop: canStopRecording 
      });
      return;
    }

    console.log('Stopping recording...');
    setCanStopRecording(false);
    
    try {
      // @ts-ignore: stopRecording may not be typed on cameraRef
      cameraRef.current.stopRecording();
    } catch (error) {
      console.log('Stop recording error:', error);
    }
  }, [recordingState.isActive, canStopRecording]);

  const toggleCameraFacing = () => {
    if (isRecording || isProcessing) return;
    setFacing((current: CameraType) =>
      current === "back" ? "front" : "back"
    );
  };

  const toggleFlash = () => {
    if (isRecording || isProcessing) return;
    setFlashEnabled((prev) => !prev);
  };

  const toggleGuidance = () => {
    setShowGuidance((prev) => !prev);
  };

  const onCameraReady = useCallback(() => {
    console.log('Camera is ready');
    setIsCameraReady(true);
  }, []);

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
        mode="video"
        ref={cameraRef}
        flash={flashEnabled ? "on" : "off"}
        focusable
        animateShutter={false}
        onCameraReady={onCameraReady}
      />
      
      {/* Enhanced Guidance Overlay */}
      {showGuidance && (
        <CylindricalGuidanceOverlay
          isRecording={isRecording}
          rotationProgress={rotationProgress}
          colorScheme={colorScheme}
        />
      )}

      {/* Real-time feedback */}
      {feedback && !isRecording && isCameraReady && (
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

      <TouchableOpacity 
        style={styles.flashButton} 
        onPress={toggleFlash}
        disabled={isRecording || isProcessing}
      >
        {flashEnabled ? (
          <Flashlight size={24} color="#FFD700" />
        ) : (
          <FlashlightOff size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.guidanceButton} onPress={toggleGuidance}>
        <Info size={20} color={showGuidance ? "#00FF88" : "#FFFFFF"} />
      </TouchableOpacity>

      {/* Camera readiness indicator */}
      {!isCameraReady && (
        <View style={styles.cameraLoadingContainer}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.flipButton,
            (isRecording || isProcessing) && styles.disabledButton
          ]}
          onPress={toggleCameraFacing}
          disabled={isRecording || isProcessing}
        >
          <Camera size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            (!isCameraReady || isProcessing || (isRecording && !canStopRecording)) &&
              styles.disabledButton,
            isRecording && styles.stopButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={
            !isCameraReady || isProcessing || (isRecording && !canStopRecording)
          }
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
      )}

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
    cameraLoadingContainer: {
      position: "absolute",
      top: '45%',
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 20,
      borderRadius: 8,
      margin: 20,
    },
    cameraLoadingText: {
      color: '#FFFFFF',
      marginTop: 10,
      fontSize: 14,
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