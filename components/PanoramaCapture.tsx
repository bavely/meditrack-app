import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, Check, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "./ui/Button";

interface PanoramaCaptureProps {
  /** Callback invoked when user finishes capturing and wants to process images */
  onProcess: (uris: string[]) => void;
  /** Optional handler when user cancels the capture session */
  onCancel?: () => void;
}

export default function PanoramaCapture({ onProcess, onCancel }: PanoramaCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);
  const cameraRef = useRef<CameraView | null>(null);
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) {
          setPhotos((prev) => [...prev, photo.uri]);
        }
      } catch (error) {
        console.warn("Failed to capture photo", error);
      }
    }
  };

  if (!permission) {
    return <View style={styles.permissionContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} />

      {/* Capture Controls */}
      <View style={styles.controls}>
        {onCancel && (
          <TouchableOpacity style={styles.iconButton} onPress={onCancel}>
            <X size={24} color={Colors[colorScheme].foreground} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <Camera size={28} color={Colors[colorScheme].foreground} />
        </TouchableOpacity>

        {photos.length > 0 && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onProcess(photos)}
          >
            <Check size={24} color={Colors[colorScheme].foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Thumbnail preview */}
      {photos.length > 0 && (
        <ScrollView
          horizontal
          style={styles.previewStrip}
          contentContainerStyle={styles.previewContent}
        >
          {photos.map((uri) => (
            <Image source={{ uri }} key={uri} style={styles.thumbnail} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors[colorScheme].background },
    camera: { flex: 1 },
    controls: {
      position: "absolute",
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 40,
    },
    captureButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors[colorScheme].surface,
      justifyContent: "center",
      alignItems: "center",
    },
    previewStrip: {
      position: "absolute",
      bottom: 120,
      left: 0,
      right: 0,
    },
    previewContent: {
      paddingHorizontal: 8,
    },
    thumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    permissionContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    permissionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      marginBottom: 12,
      textAlign: "center",
    },
  });
}

export { PanoramaCaptureProps };

