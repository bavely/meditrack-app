import * as ImagePicker from 'expo-image-picker';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

import type { AlternativeScanResult } from './types';

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
