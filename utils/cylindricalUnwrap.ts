import * as FileSystem from "expo-file-system";

/**
 * Unwrap a cylindrical label from a recorded video by delegating to a backend service.
 * Returns a path to the flattened image written to the cache directory.
 */
export async function unwrapCylindricalLabel(videoUri: string): Promise<string> {
  console.log("Unwrapping cylindrical label from video:", videoUri);
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: videoUri,
      name: "label.mp4",
      type: "video/mp4",
    } as any);

    const response = await fetch(`http://192.168.50.5:5050/unwrap`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Unwrap request failed");
    }

    const { imageUrl } = await response.json();
    if (!imageUrl) {
      throw new Error("No imageUrl returned");
    }

    const localUri = `${FileSystem.cacheDirectory}flattened_${Date.now()}.jpg`;
    const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
    console.log("Cylindrical label unwrapped to:", uri);
    return uri;
  } catch (err) {
    console.error("cylindrical unwrap failed", err);
    throw err;
  }
}
