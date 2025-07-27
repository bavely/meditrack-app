import { Colors } from "@/constants/Colors";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";
import { Camera, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Import Dimensions
import mime from 'react-native-mime-types';
import MlkitOcr from 'react-native-mlkit-ocr';
import Button from "../../components/ui/Button";

// Get screen dimensions for responsive styling
const { width: screenWidth } = Dimensions.get('window');

export default function ScanMedicationScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  
  const cameraRef = useRef(null);

  const prepareFile = (uri: string) => {
    const fileName = uri.split('/').pop() || 'photo.jpg';
    console.log(mime.lookup(fileName), "mime")
    const fileType = mime.lookup(fileName) || 'image/jpeg';

    
  
    return {
      uri,
      name: fileName,
      type: fileType,
    };
  };
  
  const handleTakePicture = async () => {
    if (isTakingPicture || isProcessing) return;
  
    setIsTakingPicture(true);
  
    try {
      // @ts-expect-error
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: true,
        base64: false,
      });
  
      if (photo?.uri) {
        setIsProcessing(true);
  
        const recognized = await MlkitOcr.detectFromFile(photo.uri);
        const labelText = recognized.map((block) => block.text).join('\n');
        console.log("🧠 OCR Result:", labelText);
  
        // Save image locally for debugging if needed
        const destPath = FileSystem.documentDirectory + 'captured-label.jpg';
        await FileSystem.copyAsync({ from: photo.uri, to: destPath });
  
        // Navigate with parsed text preview
        router.replace({
          pathname: "/medication/add",
          params: {
            name: "Parsed from MLKit",
            dosage: "",
            frequency: "",
            instructions: labelText.slice(0, 200),
          },
        });
      }
    } catch (error) {
      console.error("Error during MLKit OCR scan:", error);
    } finally {
      setIsTakingPicture(false);
      setIsProcessing(false);
    }
  };
  
  
  const toggleCameraFacing = () => {
    setFacing((current : CameraType) => (current === "back" ? "front" : "back"));
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
      >
        {/* Overlay with scanning frame */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          
          <Text style={styles.instructionText}>
            Position the medication label within the frame
          </Text>
        </View>
        
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#FFFFFF" />
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
            ]}
            onPress={handleTakePicture}
            disabled={isTakingPicture || isProcessing}
          >
            {isTakingPicture ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          
          <View style={styles.placeholderButton} />
        </View>
      </CameraView>
      
      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={Colors.light.tint} size="large" />
            <Text style={styles.processingText}>Analyzing label...</Text>
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
    width: screenWidth * 0.9, // 90% of screen width
    aspectRatio: 1.5, // Maintain a rectangular aspect ratio suitable for labels (e.g., 3:2)
    borderRadius: 12,
    position: "relative",
    borderColor: "#FFFFFF", // Added for visibility
    borderWidth: 2, // Added for visibility
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 12,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: screenWidth * 0.1, // Adjust padding based on screen width
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.7,
  },
  placeholderButton: {
    width: 50,
    height: 50,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
  },
  processingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
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
