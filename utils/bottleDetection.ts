/**
 * Bottle Detection and Analysis Utilities
 * 
 * This module provides utilities for detecting and analyzing cylindrical bottles
 * in camera frames to improve scanning accuracy and user guidance.
 */

export interface BottleDetectionResult {
  isBottleDetected: boolean;
  confidence: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  orientation: 'vertical' | 'horizontal' | 'unknown';
  distance: 'too_close' | 'optimal' | 'too_far' | 'unknown';
  quality: {
    lighting: 'poor' | 'good' | 'excellent';
    focus: 'blurry' | 'acceptable' | 'sharp';
    labelVisibility: 'hidden' | 'partial' | 'clear';
  };
  recommendations: string[];
}

export interface ScanningMetrics {
  frameCount: number;
  rotationCoverage: number; // 0-100%
  qualityScore: number; // 0-100
  estimatedCompleteness: number; // 0-100%
}

/**
 * Analyzes a camera frame to detect cylindrical bottles
 * Note: This is a simplified implementation. In a production app,
 * you would use ML models like TensorFlow Lite or Core ML
 */
export function analyzeFrameForBottle(
  frameUri: string,
  frameWidth: number,
  frameHeight: number
): Promise<BottleDetectionResult> {
  return new Promise((resolve) => {
    // Simulate bottle detection analysis
    // In a real implementation, this would use computer vision
    setTimeout(() => {
      const mockResult: BottleDetectionResult = {
        isBottleDetected: true,
        confidence: 0.85,
        position: {
          x: frameWidth * 0.3,
          y: frameHeight * 0.2,
          width: frameWidth * 0.4,
          height: frameHeight * 0.6,
        },
        orientation: 'vertical',
        distance: 'optimal',
        quality: {
          lighting: 'good',
          focus: 'sharp',
          labelVisibility: 'clear',
        },
        recommendations: [
          'Position detected - good alignment',
          'Lighting is adequate',
          'Ready to start recording'
        ],
      };
      resolve(mockResult);
    }, 100);
  });
}

/**
 * Calculates optimal camera positioning for cylindrical bottle scanning
 */
export function calculateOptimalPosition(
  bottlePosition: { x: number; y: number; width: number; height: number },
  frameWidth: number,
  frameHeight: number
): {
  optimalX: number;
  optimalY: number;
  optimalDistance: number;
  adjustments: string[];
} {
  const centerX = frameWidth / 2;
  const centerY = frameHeight / 2;
  const bottleCenterX = bottlePosition.x + bottlePosition.width / 2;
  const bottleCenterY = bottlePosition.y + bottlePosition.height / 2;

  const adjustments: string[] = [];

  // Check horizontal alignment
  const horizontalOffset = Math.abs(bottleCenterX - centerX);
  if (horizontalOffset > frameWidth * 0.1) {
    adjustments.push(
      bottleCenterX < centerX ? 'Move camera right' : 'Move camera left'
    );
  }

  // Check vertical alignment
  const verticalOffset = Math.abs(bottleCenterY - centerY);
  if (verticalOffset > frameHeight * 0.1) {
    adjustments.push(
      bottleCenterY < centerY ? 'Move camera down' : 'Move camera up'
    );
  }

  // Estimate optimal distance based on bottle size
  const bottleArea = bottlePosition.width * bottlePosition.height;
  const frameArea = frameWidth * frameHeight;
  const fillRatio = bottleArea / frameArea;

  let optimalDistance = 8; // inches
  if (fillRatio > 0.6) {
    adjustments.push('Move camera farther away');
    optimalDistance = 10;
  } else if (fillRatio < 0.2) {
    adjustments.push('Move camera closer');
    optimalDistance = 6;
  }

  return {
    optimalX: centerX,
    optimalY: centerY,
    optimalDistance,
    adjustments,
  };
}

/**
 * Tracks rotation progress during video recording
 */
export class RotationTracker {
  private frames: Array<{
    timestamp: number;
    bottlePosition: { x: number; y: number; width: number; height: number };
  }> = [];
  
  private startTime: number = 0;
  private initialPosition: { x: number; y: number } | null = null;

  startTracking(): void {
    this.frames = [];
    this.startTime = Date.now();
    this.initialPosition = null;
  }

  addFrame(bottlePosition: { x: number; y: number; width: number; height: number }): void {
    const timestamp = Date.now();
    
    if (!this.initialPosition) {
      this.initialPosition = {
        x: bottlePosition.x + bottlePosition.width / 2,
        y: bottlePosition.y + bottlePosition.height / 2,
      };
    }

    this.frames.push({
      timestamp,
      bottlePosition,
    });
  }

  getRotationProgress(): number {
    if (this.frames.length < 2 || !this.initialPosition) {
      return 0;
    }

    // Calculate total camera movement relative to bottle
    let totalMovement = 0;
    let maxMovement = 0;

    for (let i = 1; i < this.frames.length; i++) {
      const current = this.frames[i];
      const previous = this.frames[i - 1];
      
      const currentCenter = {
        x: current.bottlePosition.x + current.bottlePosition.width / 2,
        y: current.bottlePosition.y + current.bottlePosition.height / 2,
      };
      
      const previousCenter = {
        x: previous.bottlePosition.x + previous.bottlePosition.width / 2,
        y: previous.bottlePosition.y + previous.bottlePosition.height / 2,
      };

      const movement = Math.sqrt(
        Math.pow(currentCenter.x - previousCenter.x, 2) +
        Math.pow(currentCenter.y - previousCenter.y, 2)
      );

      totalMovement += movement;
      maxMovement = Math.max(maxMovement, movement);
    }

    // Estimate rotation progress (360 degrees = 100%)
    // This is a simplified calculation - in practice, you'd use more sophisticated tracking
    const estimatedFullRotation = Math.PI * 100; // Simplified estimate
    const progress = Math.min(100, (totalMovement / estimatedFullRotation) * 100);
    
    return progress;
  }

  getScanningMetrics(): ScanningMetrics {
    const rotationProgress = this.getRotationProgress();
    const frameCount = this.frames.length;
    
    // Calculate quality score based on various factors
    let qualityScore = 0;
    
    // Frame rate quality (30fps ideal for 6 seconds = 180 frames)
    const expectedFrames = 180;
    const frameRateScore = Math.min(100, (frameCount / expectedFrames) * 100);
    qualityScore += frameRateScore * 0.3;
    
    // Rotation coverage
    qualityScore += rotationProgress * 0.5;
    
    // Consistency (steady movement)
    let consistencyScore = 100;
    if (this.frames.length > 10) {
      const movements = [];
      for (let i = 1; i < this.frames.length; i++) {
        const current = this.frames[i];
        const previous = this.frames[i - 1];
        const movement = Math.sqrt(
          Math.pow((current.bottlePosition.x - previous.bottlePosition.x), 2) +
          Math.pow((current.bottlePosition.y - previous.bottlePosition.y), 2)
        );
        movements.push(movement);
      }
      
      const avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;
      const variance = movements.reduce((sum, movement) => 
        sum + Math.pow(movement - avgMovement, 2), 0) / movements.length;
      
      consistencyScore = Math.max(0, 100 - (variance / avgMovement) * 10);
    }
    
    qualityScore += consistencyScore * 0.2;

    return {
      frameCount,
      rotationCoverage: rotationProgress,
      qualityScore: Math.round(qualityScore),
      estimatedCompleteness: Math.min(100, rotationProgress),
    };
  }

  reset(): void {
    this.frames = [];
    this.startTime = 0;
    this.initialPosition = null;
  }
}

/**
 * Provides real-time feedback for scanning quality
 */
export function generateScanningFeedback(
  detectionResult: BottleDetectionResult,
  metrics: ScanningMetrics,
  isRecording: boolean
): {
  status: 'excellent' | 'good' | 'poor' | 'error';
  message: string;
  suggestions: string[];
} {
  if (!detectionResult.isBottleDetected) {
    return {
      status: 'error',
      message: 'No bottle detected',
      suggestions: [
        'Position bottle in camera view',
        'Ensure good lighting',
        'Hold bottle vertically'
      ],
    };
  }

  if (!isRecording) {
    // Pre-recording feedback
    if (detectionResult.quality.lighting === 'poor') {
      return {
        status: 'poor',
        message: 'Improve lighting conditions',
        suggestions: ['Move to better lit area', 'Turn on flash if needed'],
      };
    }

    if (detectionResult.distance !== 'optimal') {
      return {
        status: 'good',
        message: `Adjust distance - currently ${detectionResult.distance.replace('_', ' ')}`,
        suggestions: detectionResult.recommendations,
      };
    }

    return {
      status: 'excellent',
      message: 'Ready to scan - tap record button',
      suggestions: ['Start recording and rotate slowly around bottle'],
    };
  }

  // During recording feedback
  if (metrics.qualityScore > 80) {
    return {
      status: 'excellent',
      message: `Excellent scanning - ${Math.round(metrics.rotationCoverage)}% complete`,
      suggestions: ['Continue rotating smoothly'],
    };
  }

  if (metrics.qualityScore > 60) {
    return {
      status: 'good',
      message: `Good progress - ${Math.round(metrics.rotationCoverage)}% complete`,
      suggestions: ['Maintain steady rotation speed'],
    };
  }

  return {
    status: 'poor',
    message: 'Scanning quality could be improved',
    suggestions: [
      'Rotate more slowly',
      'Keep bottle in center of frame',
      'Maintain consistent distance'
    ],
  };
}