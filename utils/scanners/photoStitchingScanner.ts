import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

import type { AlternativeScanResult } from './types';

export interface PhotoStitchingOptions {
  numberOfPhotos: number;
  overlapPercentage: number;
  stitchingMethod: 'horizontal' | 'cylindrical';
  enhanceText: boolean;
  /** URL of backend stitching service */
  stitchServiceUrl?: string;
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
      stitchServiceUrl: undefined,
      ...options,
    };
  }

  async capturePhotoSequence(): Promise<string[]> {
    const images: string[] = [];
    const captureErrors: string[] = [];

    for (let i = 0; i < this.options.numberOfPhotos; i++) {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          aspect: [3, 4],
        });

        if (!result.canceled && result.assets[0]) {
          images.push(result.assets[0].uri);
        } else {
          captureErrors.push(`Photo ${i + 1} capture canceled or failed`);
        }
      } catch (error) {
        captureErrors.push(`Photo ${i + 1} error: ${error instanceof Error ? error.message : error}`);
      }

      // Brief pause between captures
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.capturedImages = images;

    if (captureErrors.length > 0) {
      throw new Error(captureErrors.join('; '));
    }

    return images;
  }

  async stitchImages(imageUris: string[]): Promise<string> {
    if (imageUris.length === 0) {
      throw new Error('No images to stitch');
    }

    if (!this.options.stitchServiceUrl) {
      throw new Error('Stitching service URL not configured');
    }

    try {
      const formData = new FormData();
      imageUris.forEach((uri, idx) => {
        formData.append('images', {
          uri,
          name: `image_${idx}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      formData.append('method', this.options.stitchingMethod);

      const response = await fetch(this.options.stitchServiceUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Stitching service responded with ${response.status}`);
      }

      const { imageBase64 } = await response.json();
      if (!imageBase64) {
        throw new Error('Stitching service did not return an image');
      }

      const stitchedUri = `${FileSystem.cacheDirectory}stitched_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(stitchedUri, imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return stitchedUri;
    } catch (error) {
      console.error('Image stitching failed:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
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

  /**
   * Processes a sequence of images that were captured externally.
   *
   * This allows a single camera session to collect all photos and
   * then pass them in for stitching without re-launching the camera
   * for each capture.
   */
  async processImageSequence(imageUris: string[]): Promise<AlternativeScanResult> {
    try {
      if (!imageUris.length) {
        throw new Error('No images provided');
      }

      this.capturedImages = imageUris;
      const stitchedImage = await this.stitchImages(imageUris);

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
        images: [...imageUris, stitchedImage],
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'photo_stitching',
        images: imageUris,
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
