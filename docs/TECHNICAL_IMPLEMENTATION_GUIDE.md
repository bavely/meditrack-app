# Technical Implementation Guide: Cylindrical Label Scanning

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API    │    │   AI Services   │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Camera/Video │ │───▶│ │Unwrap Service│ │    │ │ OCR Engine  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ OCR Engine  │ │◄───│ │File Storage  │ │    │ │GPT-4 Turbo  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │   GraphQL   │ │◄──▶│ │   GraphQL    │ │◄──▶│                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Video Capture**: React Native camera records 6-second video
2. **Upload**: Video uploaded to `/unwrap` endpoint via FormData
3. **Processing**: Backend computer vision unwraps cylindrical surface
4. **Download**: Flattened image URL returned and downloaded locally
5. **OCR**: MLKit processes flattened image for text extraction
6. **Parsing**: GraphQL mutation sends text to AI parsing service
7. **Result**: Structured medication data returned to app

## Frontend Implementation

### Core Components

#### 1. Camera Interface (`scan.tsx`)
```typescript
interface ScanScreenState {
  isRecording: boolean;
  rotationProgress: number;
  bottleDetection: BottleDetectionResult | null;
  scanningMetrics: ScanningMetrics;
  showGuidance: boolean;
}
```

**Key Features:**
- Video recording with timed duration (6 seconds)
- Real-time progress tracking with haptic feedback
- Voice announcements at rotation milestones
- Quality assessment and user guidance

#### 2. Guidance Overlay (`CylindricalGuidanceOverlay.tsx`)
```typescript
interface GuidanceProps {
  isRecording: boolean;
  rotationProgress: number;
  colorScheme: 'light' | 'dark';
}
```

**Visual Elements:**
- SVG-based cylindrical bottle representation
- Rotation path indicators with progress tracking
- Real-time quality feedback with color coding
- Positioning guides and distance indicators

#### 3. Bottle Detection (`bottleDetection.ts`)
```typescript
interface BottleDetectionResult {
  isBottleDetected: boolean;
  confidence: number;
  position: { x: number; y: number; width: number; height: number };
  orientation: 'vertical' | 'horizontal' | 'unknown';
  distance: 'too_close' | 'optimal' | 'too_far' | 'unknown';
  quality: {
    lighting: 'poor' | 'good' | 'excellent';
    focus: 'blurry' | 'acceptable' | 'sharp';
    labelVisibility: 'hidden' | 'partial' | 'clear';
  };
}
```

### Video Processing Pipeline

#### Recording Parameters
```typescript
const recordingConfig = {
  maxDuration: 6, // seconds
  quality: CameraQuality.MEDIUM,
  format: 'mp4',
  frameRate: 30
};
```

#### Frame Analysis
```typescript
class RotationTracker {
  private frames: Array<{
    timestamp: number;
    bottlePosition: Position;
  }> = [];

  addFrame(position: Position): void {
    // Track bottle position across frames
    // Calculate rotation progress
    // Assess scanning quality
  }

  getScanningMetrics(): ScanningMetrics {
    // Calculate quality score, coverage, completeness
  }
}
```

### Real-time Feedback System

#### Quality Assessment
```typescript
function generateScanningFeedback(
  detection: BottleDetectionResult,
  metrics: ScanningMetrics,
  isRecording: boolean
): FeedbackResult {
  // Analyze bottle detection confidence
  // Check positioning and distance
  // Evaluate lighting and focus quality
  // Provide actionable recommendations
}
```

#### Status Indicators
- **Excellent** (Green): Optimal conditions, high confidence
- **Good** (Yellow): Acceptable with minor adjustments needed  
- **Poor** (Orange): Suboptimal conditions requiring improvement
- **Error** (Red): Critical issues preventing successful scan

## Backend Implementation

### Unwrapping Service Architecture

#### Input Processing
```python
@app.route('/unwrap', methods=['POST'])
def unwrap_cylindrical_label():
    # Receive video file via FormData
    video_file = request.files['file']
    
    # Extract frames from video
    frames = extract_video_frames(video_file)
    
    # Process cylindrical unwrapping
    flattened_image = process_cylindrical_unwrapping(frames)
    
    # Store and return image URL
    image_url = store_processed_image(flattened_image)
    return jsonify({'imageUrl': image_url})
```

#### Computer Vision Pipeline
```python
def process_cylindrical_unwrapping(frames):
    # 1. Feature detection and tracking
    keypoints = detect_sift_features(frames)
    
    # 2. Camera motion estimation
    camera_trajectory = estimate_camera_motion(keypoints)
    
    # 3. 3D reconstruction
    cylinder_model = reconstruct_cylinder_geometry(
        frames, camera_trajectory
    )
    
    # 4. Texture mapping and unwrapping
    flattened_texture = unwrap_cylinder_texture(
        cylinder_model, frames
    )
    
    # 5. Image optimization
    enhanced_image = enhance_text_visibility(flattened_texture)
    
    return enhanced_image
```

### Processing Algorithms

#### 1. Feature Detection
- **SIFT/ORB**: Extract robust features from frames
- **Optical Flow**: Track feature movement between frames
- **Homography**: Estimate geometric transformations

#### 2. 3D Reconstruction
- **Structure from Motion**: Recover camera poses and 3D points
- **Cylinder Fitting**: Fit geometric cylinder to point cloud
- **Surface Parameterization**: Map 3D surface to 2D coordinates

#### 3. Texture Unwrapping
- **UV Mapping**: Project cylinder surface to flat coordinates
- **Seam Optimization**: Minimize visible seams in unwrapped image
- **Blending**: Combine multiple views for complete coverage

#### 4. Post-Processing
- **Contrast Enhancement**: Improve text readability
- **Noise Reduction**: Remove artifacts from reconstruction
- **Resolution Optimization**: Ensure optimal size for OCR

### API Specifications

#### Unwrapping Endpoint
```
POST /unwrap
Content-Type: multipart/form-data

Parameters:
- file: video file (MP4 format, max 50MB)

Response:
{
  "success": boolean,
  "imageUrl": string,
  "processingTime": number,
  "quality": {
    "confidence": number,
    "coverage": number,
    "resolution": { width: number, height: number }
  },
  "error": string | null
}
```

#### GraphQL Parsing Mutation
```graphql
mutation ParseMedicationLabel($label: String!) {
  parseMedicationLabel(label: $label) {
    success
    data {
      name
      dosage
      frequency
      instructions
      warnings
      manufacturer
      ndc
    }
    confidence
    error
  }
}
```

## Quality Assurance

### Testing Strategies

#### Unit Tests
```typescript
describe('BottleDetection', () => {
  test('should detect vertical bottle orientation', () => {
    const result = analyzeFrameForBottle(mockFrame);
    expect(result.orientation).toBe('vertical');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

#### Integration Tests
```typescript
describe('ScanningWorkflow', () => {
  test('should complete full scanning pipeline', async () => {
    const video = await recordMockVideo();
    const flattened = await unwrapCylindricalLabel(video.uri);
    const text = await MlkitOcr.detectFromUri(flattened);
    const parsed = await handleParsedText(text);
    
    expect(parsed.data).toBeDefined();
    expect(parsed.data.name).toBeTruthy();
  });
});
```

#### Performance Monitoring
```typescript
const performanceMetrics = {
  videoUploadTime: number,
  unwrappingProcessTime: number,
  ocrProcessTime: number,
  totalScanTime: number,
  successRate: number,
  qualityScore: number
};
```

### Error Handling

#### Client-Side Fallbacks
```typescript
try {
  const result = await unwrapCylindricalLabel(videoUri);
  return await processOCR(result);
} catch (error) {
  console.error('Unwrapping failed:', error);
  
  // Fallback to direct OCR on video frames
  return await processVideoFramesDirectly(videoUri);
}
```

#### Backend Resilience
```python
def unwrap_with_fallback(video_file):
    try:
        return advanced_unwrapping(video_file)
    except ProcessingError:
        # Fallback to simpler stitching method
        return basic_frame_stitching(video_file)
    except Exception:
        # Ultimate fallback
        return extract_best_frame(video_file)
```

## Performance Optimization

### Frontend Optimizations

#### Memory Management
```typescript
// Cleanup video files after processing
const cleanupVideoFile = async (uri: string) => {
  try {
    await FileSystem.deleteAsync(uri);
  } catch (error) {
    console.warn('Failed to cleanup video file:', error);
  }
};
```

#### Background Processing
```typescript
// Use background task for file upload
const uploadVideo = async (uri: string) => {
  return BackgroundTask.start(async () => {
    const response = await fetch('/unwrap', {
      method: 'POST',
      body: formData
    });
    return response.json();
  });
};
```

### Backend Optimizations

#### Parallel Processing
```python
import concurrent.futures

def process_frames_parallel(frames):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        feature_futures = [
            executor.submit(extract_features, frame) 
            for frame in frames
        ]
        features = [f.result() for f in feature_futures]
    return features
```

#### Caching Strategies
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cylinder_model(frame_hash):
    # Cache computed cylinder models
    return reconstruct_cylinder(frame_hash)
```

## Monitoring and Analytics

### Metrics Collection
```typescript
const scanningAnalytics = {
  scanAttempts: number,
  successfulScans: number,
  averageQualityScore: number,
  commonFailureReasons: string[],
  averageProcessingTime: number,
  userSatisfactionScore: number
};
```

### Performance Tracking
```python
import time
from dataclasses import dataclass

@dataclass
class ProcessingMetrics:
    start_time: float
    end_time: float
    frame_count: int
    success: bool
    quality_score: float
    error_type: str | None
```

## Future Enhancements

### Machine Learning Improvements
- Train custom bottle detection models
- Implement real-time quality assessment
- Add adaptive parameter tuning
- Develop user behavior prediction

### Processing Optimizations
- Edge-based cylindrical unwrapping
- Progressive quality enhancement
- Multi-resolution processing
- Temporal consistency improvements

### User Experience Enhancements
- AR guidance overlays
- Adaptive capture timing
- Personalized scanning recommendations
- Accessibility improvements

## Security Considerations

### Data Privacy
- Video files stored temporarily only
- PHI sanitization before backend processing
- Encryption for all network transfers
- User consent for data processing

### Backend Security
- Input validation and sanitization
- Rate limiting for API endpoints
- Secure file storage with expiration
- Audit logging for all operations

This technical implementation provides a robust, scalable foundation for cylindrical medication bottle label scanning with comprehensive quality assurance and user guidance features.