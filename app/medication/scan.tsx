import { Colors } from "@/constants/Colors";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { DeviceMotion } from "expo-sensors";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  Play,
  RotateCw,
  Square,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import Button from "../../components/ui/Button";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";
import { sizes } from "../../constants/Theme";

// Get screen dimensions for responsive styling
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type CaptureMode = "single" | "rotating";

interface MotionData {
  x: number;
  y: number;
  z: number;
}

interface ExtractedMedication {
  medicationName: string;
  dosage: string;
  instructions: string;
}

export default function ScanMedicationScreen() {
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("rotating");
  const [isRotatingCapture, setIsRotatingCapture] = useState(false);
  const [capturedTexts, setCapturedTexts] = useState<string[]>([]);
  const [rotationProgress, setRotationProgress] = useState(0);
  
  // Motion detection states
  const [motionData, setMotionData] = useState<MotionData>({ x: 0, y: 0, z: 0 });
  const [isMotionDetected, setIsMotionDetected] = useState(false);
  const [motionSensitivity, setMotionSensitivity] = useState(0.5); // Adjustable sensitivity
  const [extractedMedication, setExtractedMedication] = useState<ExtractedMedication | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraRef = useRef(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const motionSubscription = useRef<any>(null);
  const motionHistoryRef = useRef<MotionData[]>([]);
  const lastCaptureTimeRef = useRef<number>(0);
   // refs mirror those states for our motion callback
 const isRotatingCaptureRef = useRef(isRotatingCapture);
 const isCompleteRef        = useRef(isComplete);

   // whenever the state changes, update the ref
   useEffect(() => {
    isRotatingCaptureRef.current = isRotatingCapture;
  }, [isRotatingCapture]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (motionSubscription.current) {
        motionSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRotatingCapture && captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, [isRotatingCapture]);

  // Initialize motion detection
  useEffect(() => {
    const setupMotionDetection = async () => {
      try {
        // Set motion detection update interval
        DeviceMotion.setUpdateInterval(100); // 100ms for responsive detection
        
        motionSubscription.current = DeviceMotion.addListener(handleMotionData);
      } catch (error) {
        console.error("Error setting up motion detection:", error);
      }
    };

    setupMotionDetection();

    return () => {
      if (motionSubscription.current) {
        motionSubscription.current.remove();
      }
    };
  }, []);


   // NEW: Centralized navigation function with error handling
   const navigateToConfirmation = async (medicationData: any) => {
    try {
      console.log("🚀 Navigating to confirmation with data:", JSON.stringify(medicationData));
      
      // Ensure we have the parsed medication data in the store
      if (medicationData) {
        setParsedMedication(medicationData);
        console.log("✅ Medication data set in store");
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to confirmation screen
      router.push("/medication/confirmation");
      console.log("✅ Navigation initiated");
      
    } catch (error) {
      console.error("❌ Navigation error:", error);
      // Fallback to add screen if navigation fails
      router.push("/medication/add");
    }
  };

    // NEW: Centralized error handling function  
    const handleNavigationError = (error: any) => {
      console.log("🧠 Parsed Text Error:", JSON.stringify(error));
      
      // Reset processing state
      setIsProcessing(false);
      setIsComplete(false);
      setExtractedMedication(null);
      
      // Navigate to add screen as fallback
      router.push("/medication/add");
    };

  const handleMotionData = (data: any) => {
    const newMotionData: MotionData = {
      x: data.acceleration?.x || 0,
      y: data.acceleration?.y || 0,
      z: data.acceleration?.z || 0,
    };

    setMotionData(newMotionData);

    // Add to motion history for smoothing
    motionHistoryRef.current.push(newMotionData);
    if (motionHistoryRef.current.length > 10) {
      motionHistoryRef.current.shift();
    }

    // Calculate motion magnitude
    const magnitude = Math.sqrt(
      Math.pow(newMotionData.x, 2) + 
      Math.pow(newMotionData.y, 2) + 
      Math.pow(newMotionData.z, 2)
    );

    // Detect rotation motion (primarily Y-axis for bottle rotation)
    const isRotating = Math.abs(newMotionData.y) > motionSensitivity || magnitude > motionSensitivity;
    setIsMotionDetected(isRotating);

    // Auto-capture during rotation mode when motion is detected
    if (isRotatingCaptureRef.current && isRotating && !isCompleteRef.current) {
      const currentTime = Date.now();
      // Throttle captures to every 300ms during motion
      if (currentTime - lastCaptureTimeRef.current > 300) {
        lastCaptureTimeRef.current = currentTime;
        captureFrameDuringMotion();
      }
    }
  };

  const processOcrText = (ocrText: string): ExtractedMedication => {
    const lines = ocrText.split("\n").filter((line) => line.trim());
    let medicationName = "";
    let dosage = "";
    let instructions = "";

    // Enhanced medication name extraction for cylindrical bottles
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Look for medication name patterns (avoiding pharmacy names and common bottle text)
      if (
        line &&
        line.length > 2 &&
        !line.toLowerCase().includes("pharmacy") &&
        !line.toLowerCase().includes("care") &&
        !line.toLowerCase().includes("prescription") &&
        !line.toLowerCase().includes("rx") &&
        !line.toLowerCase().includes("refill") &&
        !line.toLowerCase().includes("label") &&
        !line.match(/^\d+/) &&
        !line.match(/^[A-Z]{2,3}\s?\d+/) // Avoid prescription numbers
      ) {
        // Prefer longer, more descriptive names
        if (!medicationName || line.length > medicationName.length) {
          medicationName = line;
        }
      }
    }

    // Enhanced dosage extraction
    const dosagePatterns = [
      /(\d+\.?\d*\s*(mg|mcg|µg|g|ml|tablets?|caps?|capsules?|units?|iu|drops?))/gi,
      /(\d+\.?\d*\s*milligram)/gi,
      /(\d+\.?\d*\s*microgram)/gi,
    ];

    for (const pattern of dosagePatterns) {
      const matches = ocrText.match(pattern);
      if (matches) {
        dosage = matches[0];
        break;
      }
    }

    // Enhanced frequency/timing instructions extraction
    const frequencyPatterns = [
      /take\s+\d+.*?(daily|twice|once|every|bedtime|morning|evening|night)/gi,
      /\d+\s+times?\s+(daily|per day|a day)/gi,
      /every\s+\d+\s+hours?/gi,
      /(once|twice|three times?)\s+(daily|a day|per day)/gi,
      /with\s+(meals?|food)/gi,
      /before\s+(meals?|bed)/gi,
      /as\s+needed/gi,
    ];

    for (const pattern of frequencyPatterns) {
      const match = ocrText.match(pattern);
      if (match) {
        instructions = match[0];
        break;
      }
    }

    return { medicationName, dosage, instructions };
  };

  const isExtractionComplete = (extraction: ExtractedMedication): boolean => {
    return !!(
      extraction.medicationName && 
      extraction.medicationName.length > 2 &&
      extraction.dosage && 
      extraction.instructions
    );
  };

  const captureFrameDuringMotion = async () => {
    console.log("🔍 Capture Frame During Motion ===============================================>");
    if (!cameraRef.current || isTakingPicture) return;

    try {
      setIsTakingPicture(true);
      
      // @ts-expect-error
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
        base64: false,
        flash: flashEnabled ? "on" : "off",
        autoFocus: true,
      });
      console.log("🔍 Photo:", photo);
      if (photo?.uri) {
        try {
          const recognized = await MlkitOcr.detectFromFile(photo.uri);
          const labelText = recognized
            .map((block) => block.text)
            .join("\n")
            .trim();
          console.log("🔍 Label Text:", labelText);
          if (labelText && labelText.length > 10) {
            // Add to captured texts
            setCapturedTexts((prev) => {
              const newTexts = [...prev, labelText];
              return newTexts.slice(-20); // Keep last 20 for efficiency
            });

            // Extract medication data from current capture
            const currentExtraction = processOcrText(labelText);
            
            // Update best extraction found so far
            setExtractedMedication(prevExtraction => {
              if (!prevExtraction) return currentExtraction;
              
              // Merge and improve extraction
              const merged: ExtractedMedication = {
                medicationName: currentExtraction.medicationName || prevExtraction.medicationName,
                dosage: currentExtraction.dosage || prevExtraction.dosage,
                instructions: currentExtraction.instructions || prevExtraction.instructions,
               
              };

              // Prefer longer, more complete data
              if (currentExtraction.medicationName && currentExtraction.medicationName.length > prevExtraction.medicationName.length) {
                merged.medicationName = currentExtraction.medicationName;
              }
              
              return merged;
            });

            console.log(`📷 Motion Capture OCR:`, labelText.slice(0, 100));
            
            // Check if we have complete information
            if (isExtractionComplete(currentExtraction)) {
              console.log("✅ Complete medication info found, stopping capture");
              stopPanoramaCapture();
              return;
            }
          }
        } catch (ocrError) {
          console.log("OCR error during motion capture:", ocrError);
        }
      }
    } catch (error) {
      console.error("Error during motion-triggered capture:", error);
    } finally {
      setIsTakingPicture(false);
    }
  };

  /**
   * Enhanced panorama text processing with better deduplication
   */
  function processPanoramaText(texts: string[]): string {
    if (!texts.length) return "";

    // Remove duplicates and very short segments
    const uniqueTexts = texts
      .filter(text => text.trim().length > 5)
      .filter((text, index, arr) => {
        // Remove very similar texts
        return !arr.slice(0, index).some(prevText => {
          const similarity = calculateSimilarity(text, prevText);
          return similarity > 0.8;
        });
      });

    if (uniqueTexts.length === 0) return "";
    if (uniqueTexts.length === 1) return uniqueTexts[0];

    // Start with the longest segment as base
    let merged = uniqueTexts.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );

    // Add unique information from other segments
    uniqueTexts.forEach(segment => {
      if (segment !== merged) {
        const lines = segment.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.length > 3 && !merged.toLowerCase().includes(trimmedLine.toLowerCase())) {
            merged += '\n' + trimmedLine;
          }
        });
      }
    });

    return merged.trim();
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const handleSingleCapture = async () => {
    if (isTakingPicture || isProcessing) return;
    setIsTakingPicture(true);
    setErrorMessage(null);

    try {
      // @ts-expect-error
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
        base64: false,
        flash: flashEnabled ? "on" : "off",
        autoFocus: true,
      });

      if (photo?.uri) {
        setIsProcessing(true);

        try {
          const recognized = await MlkitOcr.detectFromFile(photo.uri);
          const labelText = recognized
            .map((block) => block.text)
            .join("\n")
            .trim();
          console.log("🔍 Label Text:", labelText);


          try {
            const res = await handleParsedText(labelText);
            console.log("🧠 Parsed Text:", JSON.stringify(res));
            
            // Verify response structure
            if (res && res.data && res.data.parseMedicationLabel && res.data.parseMedicationLabel.data) {
              await navigateToConfirmation(res.data.parseMedicationLabel.data);
            } else {
              console.warn("⚠️ Unexpected response structure:", res);
              throw new Error("Invalid response structure");
            }
          } catch (parseError) {
            console.error("🧠 Parse/Navigation Error:", parseError);
            handleNavigationError(parseError);
          }

          // Save image locally for debugging
          const destPath = FileSystem.documentDirectory + "captured-label.jpg";
          await FileSystem.copyAsync({ from: photo.uri, to: destPath });

          // Navigate with parsed data
        
        } catch (ocrError) {
          console.error("OCR processing error:", ocrError);
          const message = "Unable to read the medication label.";
          setErrorMessage(message);
          Alert.alert(
            "Scanning Error",
            "Unable to read the medication label. You can retry or enter the details manually.",
            [
              { text: "Retry", onPress: () => setErrorMessage(null) },
              { text: "Enter Manually", onPress: () => router.push("/medication/add") }
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error during camera capture:", error);
    } finally {
      setIsTakingPicture(false);
      setIsProcessing(false);
    }
  };

  const stopPanoramaCapture = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    setIsRotatingCapture(false);
    setIsProcessing(true);
    setIsComplete(true);
    progressAnimation.setValue(0);

    // Process the final result
    setTimeout(async () => {
      try {
        const processedText = processPanoramaText(capturedTexts);
        console.log("📷 Panorama Combined Result:", processedText);

        // Use the best extraction found during motion capture, or process the combined text
        const finalExtraction = extractedMedication && isExtractionComplete(extractedMedication) 
          ? extractedMedication 
          : processedText

        console.log("🧠 Final Extracted Data:", finalExtraction);

        // Send the final result to the backend
        try {
          const res = await handleParsedText(`${finalExtraction.toString()} ${processedText}`);
          console.log("🧠 Parsed Text:", JSON.stringify(res));
          
          // Verify response structure
          if (res && res.data && res.data.parseMedicationLabel && res.data.parseMedicationLabel.data) {
            await navigateToConfirmation(res.data.parseMedicationLabel.data);
          } else {
            console.warn("⚠️ Unexpected response structure:", res);
            throw new Error("Invalid response structure");
          }
        } catch (parseError) {
          console.error("🧠 Parse/Navigation Error:", parseError);
          handleNavigationError(parseError);
        }
      } catch (error) {
        console.error("❌ Error in stopPanoramaCapture:", error);
        handleNavigationError(error);
      } finally {
        // Reset states
        setIsProcessing(false);
        setIsComplete(false);
        setExtractedMedication(null);
      }
    }, 1500);
  };

  const startPanoramaCapture = async () => {
    // Clear any existing intervals
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    setIsRotatingCapture(true);
    setCapturedTexts([]);
    setRotationProgress(0);
    setExtractedMedication(null);
    setIsComplete(false);
    lastCaptureTimeRef.current = 0;

    // Animate progress bar for panorama duration
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 15000, // 15 seconds for complete panorama with motion detection
      useNativeDriver: false,
    }).start();

    // Set up completion timer (fallback)
    setTimeout(() => {
      if (isRotatingCapture && !isComplete) {
        console.log("📱 Motion capture timeout reached");
        stopPanoramaCapture();
      }
    }, 15000);

    // Update progress periodically
    const progressInterval = setInterval(() => {
      setRotationProgress(prev => {
        const nextProgress = prev + (100 / 150); // 15 seconds = 150 intervals of 100ms
        if (nextProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return nextProgress;
      });
    }, 100);
  };

  const toggleCameraFacing = () => {
    setFacing((current: CameraType) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  const dismissInstructions = () => {
    setShowInstructions(false);
  };

  const toggleCaptureMode = () => {
    setCaptureMode((prev) => (prev === "single" ? "rotating" : "single"));
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
        focusable={true}
      >
        {/* Scanning frame overlay */}
        <View style={styles.overlay}>
          <View style={[
            styles.scanFrame,
            isMotionDetected && isRotatingCapture && styles.scanFrameActive
          ]}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />

            {/* Guide lines */}
            <View style={styles.guideLineHorizontal} />
            <View style={styles.guideLineVertical} />

            {/* Motion indicator */}
            {isRotatingCapture && (
              <View style={styles.motionIndicator}>
                <View style={[
                  styles.motionDot,
                  isMotionDetected && styles.motionDotActive
                ]} />
              </View>
            )}

            {/* Rotation progress indicator */}
            {isRotatingCapture && (
              <View style={styles.progressContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <Text style={styles.instructionText}>
            {captureMode === "single"
              ? "Position the medication label within the frame"
              : isRotatingCapture
                ? isMotionDetected 
                  ? "Perfect! Keep rotating slowly..."
                  : "Rotate the bottle slowly and steadily"
                : "Hold bottle in frame and tap to start motion capture"}
          </Text>

          {captureMode === "rotating" && !isRotatingCapture && (
            <Text style={styles.tipText}>
              Slowly rotate 360° - motion sensors will auto-capture frames
            </Text>
          )}

          {isRotatingCapture && (
            <View style={styles.captureStats}>
              <Text style={styles.progressText}>
                Progress: {Math.round(rotationProgress)}%
              </Text>
              <Text style={styles.captureCountText}>
                Captured: {capturedTexts.length} segments
              </Text>
              {/* {extractedMedication && (
                <View style={styles.extractionPreview}>
                  {extractedMedication.medicationName && (
                    <Text style={styles.extractedText}>
                      📋 {extractedMedication.medicationName}
                    </Text>
                  )}
                  {extractedMedication.dosage && (
                    <Text style={styles.extractedText}>
                      💊 {extractedMedication.dosage}
                    </Text>
                  )}
                  {extractedMedication.instructions && (
                    <Text style={styles.extractedText}>
                      ⏰ {extractedMedication.instructions}
                    </Text>
                  )}
                </View>
              )} */}
            </View>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Flash toggle button */}
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          {flashEnabled ? (
            <Flashlight size={24} color="#FFD700" />
          ) : (
            <FlashlightOff size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Capture mode toggle */}
        <TouchableOpacity style={styles.modeButton} onPress={toggleCaptureMode}>
          <RotateCw
            size={24}
            color={captureMode === "rotating" ? "#00FF88" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Motion data display (debug) */}
        {isRotatingCapture && (
          <View style={styles.motionDebug}>
            <Text style={styles.motionText}>
              Motion: {isMotionDetected ? "🟢" : "🔴"}
            </Text>
            <Text style={styles.motionText}>
              Y: {motionData.y.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Camera controls */}
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
              (isTakingPicture || isProcessing) && styles.disabledButton,
              isRotatingCapture && styles.stopButton,
            ]}
            onPress={
              captureMode === "single"
                ? handleSingleCapture
                : isRotatingCapture
                  ? stopPanoramaCapture
                  : startPanoramaCapture
            }
            disabled={isTakingPicture || isProcessing}
          >
            {isTakingPicture || isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : isRotatingCapture ? (
              <Square size={30} color="#FFFFFF" fill="#FFFFFF" />
            ) : captureMode === "rotating" ? (
              <Play size={30} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </CameraView>

      {/* Instructions overlay */}
      {showInstructions && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsCard}>
            {/* Medication bottle icon */}
            <View style={styles.bottleIcon}>
              <View style={styles.bottleCap} />
              <View style={styles.bottleBody}>
                <View style={styles.bottleLabel}>
                  <View style={styles.labelLine} />
                  <View style={styles.labelLine} />
                  <View style={styles.labelLine} />
                </View>
              </View>
            </View>

            <Text style={styles.instructionsTitle}>Smart Motion Scanning</Text>

            <Text style={styles.instructionsDescription}>
              For cylindrical bottles, use rotation mode. To scan a flat label, toggle to single mode by pressing the loop button looks like this &nbsp; <RotateCw size={24}  color="#00FF88" /> 
              &nbsp; in the top left corner.
            </Text>

            <TouchableOpacity
              style={styles.startScanningButton}
              onPress={dismissInstructions}
            >
              <Text style={styles.startScanningText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={Colors.light.tint} size="large" />
            <Text style={styles.processingText}>
              {captureMode === "rotating"
                ? "Processing motion-captured data..."
                : "Analyzing medication label..."}
            </Text>
            <Text style={styles.processingSubtext}>
              {captureMode === "rotating"
                ? "Combining all captured frames and extracting complete medication info"
                : "Extracting medication details"}
            </Text>
          </View>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.4,
    borderRadius: 12,
    position: "relative",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
  },
  scanFrameActive: {
    borderColor: "#00FF88",
    borderWidth: 2,
  },
  cornerTopLeft: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00FF88",
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00FF88",
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00FF88",
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00FF88",
    borderBottomRightRadius: 12,
  },
  guideLineHorizontal: {
    position: "absolute",
    top: "50%",
    left: "20%",
    right: "20%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ translateY: -0.5 }],
  },
  guideLineVertical: {
    position: "absolute",
    left: "50%",
    top: "20%",
    bottom: "20%",
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ translateX: -0.5 }],
  },
  progressContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#00FF88",
    borderRadius: 2,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 24,
  },
  tipText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  captureStats: {
    alignItems: "center",
    marginTop: 16,
  },
  progressText: {
    color: "#00FF88",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  captureCountText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  flashButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modeButton: {
    position: "absolute",
    top: 120,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  stopButton: {
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    borderColor: "#FF0000",
  },
  captureButtonInner: {
    width: sizes.lg,
    height: sizes.lg,
    borderRadius: sizes.lg / 2,
    backgroundColor: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeholderButton: {
    width: 56,
    height: 56,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  instructionsCard: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  bottleIcon: {
    alignItems: "center",
    marginBottom: 60,
  },
  bottleCap: {
    width: 50,
    height: 20,
    backgroundColor: "#666666",
    borderRadius: 10,
    marginBottom: 2,
  },
  bottleBody: {
    width: 80,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#CCCCCC",
  },
  bottleLabel: {
    width: 60,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  labelLine: {
    width: 45,
    height: 8,
    backgroundColor: "#FF6B6B",
    marginBottom: 4,
    borderRadius: 2,
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  instructionsDescription: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 80,
    paddingHorizontal: 20,
  },
  startScanningButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 80,
    paddingVertical: 16,
    borderRadius: 25,
    width: "85%",
    maxWidth: 300,
  },
  startScanningText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "85%",
    maxWidth: 320,
  },
  processingText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginTop: 20,
    textAlign: "center",
  },
  processingSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    minWidth: 200,
  },
  motionIndicator: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  motionDotActive: {
    backgroundColor: "#FF0000",
  },
  motionDot: {
    backgroundColor: "#FFFFFF",
  },
  extractionPreview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },  
  extractedText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  motionDebug: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  motionText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 4,
  },
  errorOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 77, 77, 0.9)",
    padding: 12,
  },
  errorText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
