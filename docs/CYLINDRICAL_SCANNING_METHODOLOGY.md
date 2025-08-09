# Cylindrical Medication Bottle Label Scanning Methodology

## Overview

MediTrack implements an advanced cylindrical label scanning system that uses video recording combined with backend image processing to capture and read medication labels wrapped around cylindrical bottles. This document outlines the complete methodology, technical implementation, and best practices.

## Current Implementation

### 1. Video-Based Cylindrical Unwrapping Approach

The current methodology employs a **video recording + backend unwrapping** strategy:

#### Process Flow:
1. **Video Capture** (6-second duration)
   - User records video while slowly rotating around the cylindrical bottle
   - Camera captures multiple angles of the curved label surface
   - Real-time progress indication with haptic feedback

2. **Backend Unwrapping Processing**
   - Video is uploaded to `/unwrap` endpoint
   - Backend service processes the video frames
   - Computer vision algorithms detect and unwrap the cylindrical surface
   - Returns a flattened 2D image of the complete label

3. **OCR Text Extraction**
   - MLKit OCR processes the flattened image
   - Extracts text blocks from the unwrapped label
   - Concatenates text blocks into readable string

4. **AI-Powered Parsing**
   - Extracted text sent to GraphQL mutation `PARSE_MED_LABEL`
   - Backend AI (GPT-4-turbo) parses medication information
   - Returns structured data (name, dosage, frequency, etc.)

### 2. Technical Implementation Details

#### Frontend Components:
- **Camera Interface**: `expo-camera` with CameraView
- **Recording Control**: 6-second timed recording with progress indicator
- **OCR Engine**: `react-native-mlkit-ocr` for on-device text recognition
- **Feedback Systems**: Haptic feedback (`expo-haptics`) and voice announcements (`expo-speech`)

#### Backend Services:
- **Unwrapping Service**: Computer vision pipeline for cylindrical surface flattening
- **AI Parsing Service**: GPT-4-turbo for medication information extraction

#### Data Flow:
```
Video Recording → Backend Unwrapping → Flattened Image → Local OCR → AI Parsing → Structured Data
```

## Advantages of Current Approach

### ✅ Strengths:
1. **Comprehensive Coverage**: Captures the entire label surface regardless of wrapping
2. **High Accuracy**: Backend unwrapping provides better results than simple photo stitching
3. **Automated Process**: Minimal user intervention required
4. **Quality Control**: Video allows multiple frames for optimal processing
5. **User Guidance**: Real-time feedback during recording process

### ⚠️ Current Limitations:
1. **Backend Dependency**: Requires internet connection and backend service availability
2. **Processing Time**: Video upload and processing introduces latency
3. **Storage Requirements**: Video files are larger than static images
4. **Rotation Skill**: Users need to learn proper rotation technique
5. **Limited Feedback**: No real-time validation of capture quality

## Best Practices for Users

### Optimal Scanning Technique:
1. **Positioning**: Hold bottle vertically, label facing camera
2. **Distance**: Maintain 6-8 inches from camera
3. **Lighting**: Ensure adequate, even lighting on label
4. **Rotation**: Slow, steady 360-degree rotation over 6 seconds
5. **Stability**: Keep bottle steady while rotating around it

### Environmental Considerations:
- Good lighting conditions (avoid shadows, glare)
- Stable hand movement
- Clean label surface (remove any obstructions)
- Sufficient space for camera movement

## Technical Specifications

### Video Recording Parameters:
- **Duration**: 6 seconds maximum
- **Format**: MP4 video format
- **Quality**: Device-dependent (typically 1080p or higher)
- **Frame Rate**: Standard device frame rate

### Processing Pipeline:
- **Upload**: FormData POST to `/unwrap` endpoint
- **Processing**: Backend computer vision algorithms
- **Download**: Flattened image returned as URL
- **OCR**: Local MLKit processing on device
- **Parsing**: GraphQL mutation with extracted text

### Error Handling:
- Network failure fallback
- Invalid video format handling
- OCR failure recovery
- AI parsing error management

## Future Enhancement Opportunities

### 1. Enhanced User Guidance
- Real-time bottle detection and positioning guides
- Visual overlay indicating optimal rotation path
- Quality indicators during recording

### 2. Alternative Scanning Methods
- Multi-frame photo stitching as backup
- Single-photo scanning for simpler labels
- Hybrid approach combining multiple methods

### 3. Performance Optimizations
- Local cylindrical unwrapping algorithms
- Progressive upload during recording
- Caching and offline processing capabilities

### 4. Quality Improvements
- Real-time frame quality assessment
- Adaptive recording duration based on label complexity
- Automatic retake suggestions

## Integration Points

### With Existing Systems:
- **Medication Store**: Integration with Zustand state management
- **Navigation**: Seamless flow to confirmation screen
- **Error Handling**: Fallback to manual entry screen
- **User Experience**: Consistent with app design patterns

### API Dependencies:
- **GraphQL Endpoint**: Medication parsing service
- **Unwrapping Service**: Cylindrical image processing
- **Authentication**: User token validation
- **File Storage**: Temporary video and image storage

## Conclusion

The current cylindrical scanning methodology represents a sophisticated approach to a complex computer vision problem. The video-based unwrapping strategy provides comprehensive label coverage and high accuracy, while the AI-powered parsing ensures reliable medication information extraction.

The system successfully handles the unique challenges of reading curved text surfaces, making it significantly more effective than traditional flat-image scanning approaches for cylindrical medication bottles.