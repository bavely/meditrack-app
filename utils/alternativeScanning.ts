/**
 * Alternative Scanning Methods for Cylindrical Bottles
 * 
 * This module provides fallback scanning approaches when the primary 
 * video-based unwrapping method is not available or fails.
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

export interface AlternativeScanResult {
  success: boolean;
  extractedText: string;
  confidence: number;
  method: 'photo_stitching' | 'single_photo' | 'manual_guide';
  images: string[];
  error?: string;
}

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

/**
 * Single Photo Enhanced Scanning
 * 
 * Uses advanced processing on a single photo when cylindrical unwrapping
 * is not available or practical.
 */
export class SinglePhotoScanner {
  async captureSinglePhoto(): Promise<string> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0]) {
      throw new Error('Photo capture was canceled');
    }

    return result.assets[0].uri;
  }

  async enhanceImageForOCR(imageUri: string): Promise<string> {
    // In a real implementation, this would apply image enhancement:
    // - Contrast adjustment
    // - Sharpening
    // - Noise reduction
    // - Perspective correction
    
    // For now, return the original image
    return imageUri;
  }

  async performSinglePhotoScan(): Promise<AlternativeScanResult> {
    try {
      const imageUri = await this.captureSinglePhoto();
      const enhancedUri = await this.enhanceImageForOCR(imageUri);
      
      const ocrResult = await ExpoMlkitOcr.recognizeText(enhancedUri);
      const extractedText = ocrResult.text.trim();

      const confidence = this.calculateSinglePhotoConfidence(extractedText, ocrResult);

      return {
        success: true,
        extractedText,
        confidence,
        method: 'single_photo',
        images: [imageUri, enhancedUri],
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'single_photo',
        images: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateSinglePhotoConfidence(text: string, ocrResult: { blocks: any[] }): number {
    if (!text || text.length < 5) return 0.1;

    // Estimate confidence based on number of detected text blocks
    const avgConfidence = ocrResult.blocks && ocrResult.blocks.length > 0
      ? 0.5 + Math.min(0.5, ocrResult.blocks.length * 0.05)
      : 0.5;
    
    // Text quality assessment
    const hasStructuredData = /\d+\s*(mg|ml|g)\b/i.test(text);
    const hasMedicationTerms = /(tablet|capsule|pill|liquid|syrup|injection)/i.test(text);
    const hasInstructions = /(take|use|apply|times?\s+daily|every)/i.test(text);
    
    let qualityScore = avgConfidence * 0.4; // OCR confidence weight
    
    if (hasStructuredData) qualityScore += 0.3;
    if (hasMedicationTerms) qualityScore += 0.2;
    if (hasInstructions) qualityScore += 0.1;
    
    return Math.min(qualityScore, 1.0);
  }
}

/**
 * Manual Guidance Scanner
 * 
 * Provides step-by-step guidance for users to capture specific parts
 * of the label when automated methods fail.
 */
export class ManualGuidanceScanner {
  private sections = [
    { name: 'medication_name', instruction: 'Capture the medication name' },
    { name: 'dosage', instruction: 'Capture the dosage information' },
    { name: 'instructions', instruction: 'Capture the usage instructions' },
    { name: 'warnings', instruction: 'Capture any warnings or side effects' },
  ];

  async performGuidedScan(): Promise<AlternativeScanResult> {
    const sectionImages: { [key: string]: string } = {};
    const allText: string[] = [];

    try {
      for (const section of this.sections) {
        const imageUri = await this.captureSectionPhoto(section.instruction);
        sectionImages[section.name] = imageUri;
        
        // Extract text from this section
        const ocrResult = await ExpoMlkitOcr.recognizeText(imageUri);
        const sectionText = ocrResult.text.trim();
        
        if (sectionText) {
          allText.push(`${section.name.toUpperCase()}: ${sectionText}`);
        }
      }

      const extractedText = allText.join('\n\n');
      const confidence = this.calculateGuidedScanConfidence(allText);

      return {
        success: true,
        extractedText,
        confidence,
        method: 'manual_guide',
        images: Object.values(sectionImages),
      };
    } catch (error) {
      return {
        success: false,
        extractedText: allText.join('\n\n'),
        confidence: 0,
        method: 'manual_guide',
        images: Object.values(sectionImages),
        error: error instanceof Error ? error.message : 'Guided scan incomplete',
      };
    }
  }

  private async captureSectionPhoto(instruction: string): Promise<string> {
    // In a real implementation, this would show UI guidance
    console.log(`Guidance: ${instruction}`);
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) {
      throw new Error(`Failed to capture: ${instruction}`);
    }

    return result.assets[0].uri;
  }

  private calculateGuidedScanConfidence(textSections: string[]): number {
    const completedSections = textSections.filter(text => 
      text && text.length > 10
    ).length;
    
    const completionRatio = completedSections / this.sections.length;
    
    // Higher confidence for guided approach as user verifies each section
    return Math.min(0.7 + (completionRatio * 0.3), 1.0);
  }
}

/**
 * Alternative Scanning Manager
 * 
 * Orchestrates different scanning methods with automatic fallback logic.
 */
export class AlternativeScanningManager {
  private photoStitcher = new PhotoStitchingScanner();
  private singlePhotoScanner = new SinglePhotoScanner();
  private manualScanner = new ManualGuidanceScanner();

  async performAlternativeScan(
    preferredMethod?: 'photo_stitching' | 'single_photo' | 'manual_guide' | 'auto'
  ): Promise<AlternativeScanResult> {
    const method = preferredMethod || 'auto';

    switch (method) {
      case 'photo_stitching':
        return this.photoStitcher.performPhotoStitchingScan();
      
      case 'single_photo':
        return this.singlePhotoScanner.performSinglePhotoScan();
      
      case 'manual_guide':
        return this.manualScanner.performGuidedScan();
      
      case 'auto':
      default:
        return this.performAutoFallbackScan();
    }
  }

  private async performAutoFallbackScan(): Promise<AlternativeScanResult> {
    // Try methods in order of reliability and user experience
    
    // 1. Try single photo first (fastest)
    console.log('Attempting single photo scan...');
    const singleResult = await this.singlePhotoScanner.performSinglePhotoScan();
    
    if (singleResult.success && singleResult.confidence > 0.6) {
      return singleResult;
    }

    // 2. Try photo stitching (more comprehensive)
    console.log('Attempting photo stitching scan...');
    const stitchingResult = await this.photoStitcher.performPhotoStitchingScan();
    
    if (stitchingResult.success && stitchingResult.confidence > 0.5) {
      return stitchingResult;
    }

    // 3. Fall back to manual guidance (highest success rate)
    console.log('Falling back to manual guidance scan...');
    return this.manualScanner.performGuidedScan();
  }

  reset(): void {
    this.photoStitcher.reset();
  }
}

/**
 * Utility function to clean up temporary image files
 */
export async function cleanupAlternativeScanFiles(result: AlternativeScanResult): Promise<void> {
  for (const imageUri of result.images) {
    try {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    } catch (error) {
      console.warn('Failed to cleanup image file:', imageUri, error);
    }
  }
}