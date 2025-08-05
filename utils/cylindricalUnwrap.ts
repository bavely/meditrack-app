import * as FileSystem from "expo-file-system";
const cv = require('opencv.js');

/**
 * Unwrap a cylindrical label from a recorded video.
 * Returns a path to the flattened image written to cache directory.
 */
export async function unwrapCylindricalLabel(videoUri: string): Promise<string> {
  try {
    const cap = new cv.VideoCapture(videoUri);
    const frames: any[] = [];
    let frame = cap.read();
    while (!frame.empty) {
      frames.push(frame);
      frame = cap.read();
    }
    if (!frames.length) {
      throw new Error("No frames found in video");
    }

    const height = frames[0].rows;
    const width = frames[0].cols;
    const panorama = new cv.Mat(height, width * frames.length, cv.CV_8UC3);

    frames.forEach((f, idx) => {
      const slice = f.warpPolar(
        new cv.Size(width, height),
        new cv.Point2(width / 2, height / 2),
        width / 2,
        cv.WARP_INVERSE_MAP
      );
      slice.copyTo(panorama.getRegion(new cv.Rect(idx * width, 0, width, height)));
    });

    const outputPath = `${FileSystem.cacheDirectory}flattened_${Date.now()}.jpg`;
    cv.imwrite(outputPath, panorama);
    return outputPath;
  } catch (err) {
    console.error("cylindrical unwrap failed", err);
    throw err;
  }
}
