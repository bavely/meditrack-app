import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

import type { AlternativeScanResult } from './types';

export interface PhotoStitchingOptions {
  numberOfPhotos: number;
  overlapPercentage: number;
  stitchingMethod: 'horizontal' | 'cylindrical';
  enhanceText: boolean;
}

/**
 * Multi-Photo Stitching Approach
 *
 * Captures multiple photos around the cylinder and stitches them together
 * as a fallback to video-based unwrapping.
 */
export class PhotoStitchingScanner {
  private capturedImages: string[] = [];
  private options: PhotoStitchingOptions;

  constructor(options: Partial<PhotoStitchingOptions> = {}) {
    this.options = {
      numberOfPhotos: 4,
      overlapPercentage: 20,
      stitchingMethod: 'cylindrical',
      enhanceText: true,
      ...options,
    };
  }

  async capturePhotoSequence(): Promise<string[]> {
    const images: string[] = [];

    for (let i = 0; i < this.options.numberOfPhotos; i++) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets[0]) {
        images.push(result.assets[0].uri);
      } else {
        throw new Error(`Failed to capture photo ${i + 1}`);
      }

      // Brief pause between captures
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.capturedImages = images;
    return images;
  }

  async stitchImages(imageUris: string[]): Promise<string> {
    try {
      // In a real implementation, this would use image stitching algorithms
      // For now, we'll simulate the process and return the best single image

      if (imageUris.length === 0) {
        throw new Error('No images to stitch');
      }

      // Simulate stitching process
      const stitchedImageUri = await this.simulateImageStitching(imageUris);

      return stitchedImageUri;
    } catch (error) {
      console.error('Image stitching failed:', error);
      throw error;
    }
  }

  private async simulateImageStitching(imageUris: string[]): Promise<string> {
    // In production, this would:
    // 1. Detect overlapping features between images
    // 2. Estimate homographies for alignment
    // 3. Warp and blend images into panorama
    // 4. Apply cylindrical projection if needed

    // For simulation, return the image with best detected text
    let bestImage = imageUris[0];
    let maxTextLength = 0;

    for (const uri of imageUris) {
      try {
        const result = await ExpoMlkitOcr.recognizeText(uri);
        const textLength = result.text.length;

        if (textLength > maxTextLength) {
          maxTextLength = textLength;
          bestImage = uri;
        }
      } catch (error) {
        console.warn('OCR failed for image:', uri, error);
      }
    }

    // Copy best image to cache with stitched name
    const timestamp = Date.now();
    const stitchedUri = `${FileSystem.cacheDirectory}stitched_${timestamp}.jpg`;
    await FileSystem.copyAsync({
      from: bestImage,
      to: stitchedUri,
    });

    return stitchedUri;
  }

  async performPhotoStitchingScan(): Promise<AlternativeScanResult> {
    try {
      const images = await this.capturePhotoSequence();
      const stitchedImage = await this.stitchImages(images);

      // Extract text from stitched image
      const ocrResult = await ExpoMlkitOcr.recognizeText(stitchedImage);
      const extractedText = ocrResult.text.trim();

      // Calculate confidence based on text quality
      const confidence = this.calculateTextConfidence(extractedText);

      return {
        success: true,
        extractedText,
        confidence,
        method: 'photo_stitching',
        images: [...images, stitchedImage],
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'photo_stitching',
        images: this.capturedImages,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateTextConfidence(text: string): number {
    // Simple heuristic for text quality assessment
    if (!text || text.length < 10) return 0.1;

    const wordCount = text.split(/\s+/).length;
    const hasNumbers = /\d/.test(text);
    const hasLetters = /[a-zA-Z]/.test(text);
    const hasMedicalTerms = /mg|ml|tablet|capsule|dosage|daily|twice/i.test(text);

    let confidence = 0.3; // Base confidence

    if (wordCount > 5) confidence += 0.2;
    if (hasNumbers && hasLetters) confidence += 0.2;
    if (hasMedicalTerms) confidence += 0.3;
    if (text.length > 50) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  reset(): void {
    this.capturedImages = [];
  }
}
