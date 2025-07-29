import { Colors } from "@/constants/Colors";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
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
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import Button from "../../components/ui/Button";
import { handleParsedText } from "../../services/medicationService";

// Get screen dimensions for responsive styling
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type CaptureMode = "single" | "rotating";

export default function ScanMedicationScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("single");
  const [isRotatingCapture, setIsRotatingCapture] = useState(false);
  const [capturedTexts, setCapturedTexts] = useState<string[]>([]);
  const [rotationProgress, setRotationProgress] = useState(0);

  const cameraRef = useRef(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRotatingCapture && captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, [isRotatingCapture]);

  const processOcrText = (ocrText: string) => {
    const lines = ocrText.split("\n").filter((line) => line.trim());
    let medicationName = "";
    let dosage = "";
    let instructions = "";

    // Try to extract medication name (usually in the first few lines)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      // Look for medication name patterns (avoiding pharmacy names)
      if (
        line &&
        !line.toLowerCase().includes("pharmacy") &&
        !line.toLowerCase().includes("care") &&
        !line.includes("RX") &&
        !line.match(/^\d+/)
      ) {
        medicationName = line;
        break;
      }
    }

    // Look for dosage information
    const dosagePattern = /(\d+\.?\d*\s*(mg|mcg|g|ml|tablets?|caps?|units?))/i;
    const dosageMatch = ocrText.match(dosagePattern);
    if (dosageMatch) {
      dosage = dosageMatch[1];
    }

    // Look for frequency/timing instructions
    const frequencyPatterns = [
      /take\s+\d+.*?(daily|twice|once|every|bedtime|morning)/i,
      /\d+\s+times?\s+(daily|per day|a day)/i,
      /every\s+\d+\s+hours?/i,
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

  /**
   * Merges OCR segments from a rotating panorama by greedy overlap.
   */
  function processPanoramaText(texts: string[]): string {
    if (!texts.length) return "";

    // Start with the first capture
    let merged = texts[0].trim();

    // Helper: find the longest overlap between end of `a` and start of `b`
    function findOverlap(a: string, b: string): number {
      const maxLen = Math.min(a.length, b.length);
      for (let len = maxLen; len > 0; len--) {
        if (a.endsWith(b.slice(0, len))) {
          return len;
        }
      }
      return 0;
    }

    for (let i = 1; i < texts.length; i++) {
      const segment = texts[i].trim();
      if (!segment) continue;

      // Compute overlap
      const overlapLen = findOverlap(merged, segment);
      // If overlap is substantial, merge; otherwise insert a line break
      if (overlapLen > segment.split(/\s+/).slice(0, 3).join(" ").length / 2) {
        merged = merged + segment.slice(overlapLen);
      } else {
        merged = merged + "\n" + segment;
      }
    }

    // Post-processing: collapse repeated lines
    const lines = merged.split("\n");
    const seen = new Set<string>();
    const unique = lines.filter((line) => {
      const key = line.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.join("\n").trim();
  }

  const handleSingleCapture = async () => {
    if (isTakingPicture || isProcessing) return;
    setIsTakingPicture(true);

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

          const { medicationName, dosage, instructions } =
            processOcrText(labelText);

          const sanitized = `${medicationName} ${dosage} ${instructions}`;

          handleParsedText(sanitized)
            .then((res) => {
              console.log("🧠 Parsed Text:", JSON.stringify(res));
            })
            .catch((err) => {
              console.log("🧠 Parsed Text Error:", JSON.stringify(err));
            });

          // Save image locally for debugging
          const destPath = FileSystem.documentDirectory + "captured-label.jpg";
          await FileSystem.copyAsync({ from: photo.uri, to: destPath });

          // Navigate with parsed data
          router.replace({
            pathname: "/medication/add",
            params: {
              name: medicationName || "Medication from scan",
              dosage: dosage,
              frequency: instructions,
              instructions: labelText.slice(0, 300),
              scannedText: labelText,
            },
          });
        } catch (ocrError) {
          console.error("OCR processing error:", ocrError);
          router.replace({
            pathname: "/medication/add",
            params: {
              name: "Scanned medication",
              dosage: "",
              frequency: "",
              instructions: "Please enter medication details manually",
            },
          });
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
    progressAnimation.setValue(0);

    // Enhanced panorama text processing
    setTimeout(() => {
      const processedText = processPanoramaText(capturedTexts);
      console.log("📷 Panorama Combined Result:", processedText);

      const { medicationName, dosage, instructions } =
        processOcrText(processedText);
      const sanitizedText = `${medicationName} ${dosage} ${instructions}`;

      // Send ONLY the final combined result to the backend
      console.log(
        "🧠 Parsed Text Service: ===============================================================================>",
        sanitizedText
      );
      handleParsedText(sanitizedText)
        .then((res) => {
          console.log("🧠 Parsed Text:", JSON.stringify(res));
        })
        .catch((err) => {
          console.log("🧠 Parsed Text Error:", JSON.stringify(err));
        })
        .finally(() => {
          // Navigate with panorama-enhanced data
          router.replace({
            pathname: "/medication/add",
            params: {
              name: medicationName || "Medication from panorama scan",
              dosage: dosage,
              frequency: instructions,
              instructions: processedText.slice(0, 500), // More text from panorama
              scannedText: processedText,
              captureMethod: "panorama",
              captureCount: capturedTexts.length.toString(),
            },
          });

          setIsProcessing(false);
        });
    }, 1500); // Longer processing time for panorama stitching
  };

  // Updated startPanoramaCapture - REMOVE handleParsedText from interval
  const startPanoramaCapture = async () => {
    // 1️⃣ If there’s already an interval, clear it first
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsRotatingCapture(true);
    setCapturedTexts([]);
    setRotationProgress(0);

    // Animate progress bar for panorama duration
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 10000, // 10 seconds for complete panorama
      useNativeDriver: false,
    }).start();

    let captureCount = 0;
    const captureFrequency = 200; // Capture every 200ms for smoother panorama
    const totalDuration = 10000; // 10 seconds total
    const maxCaptures = totalDuration / captureFrequency; // 50 captures

    captureIntervalRef.current = setInterval(async () => {
      try {
        // @ts-expect-error
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.8, // Good quality for panorama stitching
          skipProcessing: false,
          base64: false,
          flash: flashEnabled ? "on" : "off",
          autoFocus: true,
          // Enable continuous autofocus for panorama
          focusDepth: 0,
        });

        if (photo?.uri) {
          try {
            // Process OCR in background for real-time feedback
            const recognized = await MlkitOcr.detectFromFile(photo.uri);
            const labelText = recognized
              .map((block) => block.text)
              .join("\n")
              .trim();

            if (labelText && labelText.length > 5) {
              // Filter out noise
              setCapturedTexts((prev) => {
                // Keep only unique text segments to avoid duplicates
                const newTexts = [...prev, labelText];
                return newTexts.slice(-30); // Keep last 30 captures for memory efficiency
              });
              console.log(
                `📷 Panorama OCR ${captureCount + 1}:`,
                labelText.slice(0, 80)
              );
            }

            // Save intermediate frames for panorama stitching reference
            if (captureCount % 5 === 0) {
              // Save every 5th frame
              const frameIndex = Math.floor(captureCount / 5);
              const framePath =
                FileSystem.documentDirectory +
                `panorama_frame_${frameIndex}.jpg`;
              await FileSystem.copyAsync({ from: photo.uri, to: framePath });
            }

            // REMOVED: handleParsedText call from here - only call once at the end
          } catch (ocrError) {
            console.log("OCR error during panorama capture:", ocrError);
          }
        }

        captureCount++;
        const progress = (captureCount / maxCaptures) * 100;
        setRotationProgress(Math.min(progress, 100));

        // 2️⃣ as soon as we hit the cap, tear it down
        if (captureCount >= maxCaptures && captureIntervalRef.current) {
          stopPanoramaCapture();
        }
      } catch (error) {
        console.error("Error during panorama capture:", error);
      }
    }, captureFrequency);
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
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to scan your medication labels.
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        flash={flashEnabled ? "on" : "off"}
        focusable={true}
        onMoveShouldSetResponderCapture={(event) => {
          console.log("🔍 Move Should Set Responder Capture", event);
          return true;
        }}
      >
        {/* Scanning frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />

            {/* Guide lines */}
            <View style={styles.guideLineHorizontal} />
            <View style={styles.guideLineVertical} />

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
                ? "Keep rotating slowly and steadily..."
                : "Hold bottle in frame and tap to start panorama capture"}
          </Text>

          {captureMode === "rotating" && !isRotatingCapture && (
            <Text style={styles.tipText}>
              Slowly rotate 360° for complete panorama scan
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

            <Text style={styles.instructionsTitle}>How does it work?</Text>

            <Text style={styles.instructionsDescription}>
              Hold your smartphone steady and position it so the medication
              details are within the frame on your screen. Ensure there&apos;s
              good lighting.
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
                ? "Processing panorama scan..."
                : "Analyzing medication label..."}
            </Text>
            <Text style={styles.processingSubtext}>
              {captureMode === "rotating"
                ? "Stitching panorama segments together"
                : "Extracting medication details"}
            </Text>
          </View>
        </View>
      )}
    </View>
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    backgroundColor: "#000000",
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
});
