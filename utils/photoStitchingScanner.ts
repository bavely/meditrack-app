import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-ignore - jimp provides a default export in runtime but typings may not declare it.
import Jimp from 'jimp';

interface Feature {
  x: number;
  y: number;
  intensity: number;
}

/**
 * Apply a simple cylindrical projection to an image. This maps the image
 * onto a cylindrical surface which helps when creating panoramas of
 * cylindrical objects like pill bottles.
 */
function applyCylindricalProjection(img: Jimp): Jimp {
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const f = w; // approximate focal length
  const cx = w / 2;
  const cy = h / 2;
  const projected = new Jimp(w, h, 0xffffffff);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const theta = (x - cx) / f;
      const sourceX = f * Math.tan(theta) + cx;
      const sourceY = (y - cy) / Math.cos(theta) + cy;
      if (sourceX >= 0 && sourceX < w && sourceY >= 0 && sourceY < h) {
        const color = img.getPixelColor(Math.round(sourceX), Math.round(sourceY));
        projected.setPixelColor(color, x, y);
      }
    }
  }

  return projected;
}

/**
 * Very small feature detector based on intensity gradients. It returns
 * points with strong intensity changes which are then used for matching.
 */
function detectFeatures(img: Jimp): Feature[] {
  const features: Feature[] = [];
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  for (let y = 1; y < h - 1; y += 5) {
    for (let x = 1; x < w - 1; x += 5) {
      const c = Jimp.intToRGBA(img.getPixelColor(x, y)).r;
      const cx = Jimp.intToRGBA(img.getPixelColor(x + 1, y)).r;
      const cy = Jimp.intToRGBA(img.getPixelColor(x, y + 1)).r;
      const grad = Math.abs(c - cx) + Math.abs(c - cy);
      if (grad > 40) {
        features.push({ x, y, intensity: grad });
      }
    }
  }
  return features;
}

/**
 * Estimate translation between two images using a crude homography
 * estimation. It searches for the offset with the lowest difference in the
 * overlapping region. The translation is represented as a 3x3 homography
 * matrix but only horizontal translation is considered.
 */
function estimateHomography(
  img1: Jimp,
  img2: Jimp,
  features1: Feature[],
  features2: Feature[]
): { dx: number; dy: number } {
  const maxOverlap = Math.min(img1.bitmap.width, img2.bitmap.width);
  let bestOffset = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let overlap = Math.floor(maxOverlap / 4); overlap < maxOverlap - 10; overlap++) {
    const x1 = img1.bitmap.width - overlap;
    const x2 = 0;
    let diff = 0;
    for (let y = 0; y < Math.min(img1.bitmap.height, img2.bitmap.height); y++) {
      for (let x = 0; x < overlap; x++) {
        const color1 = img1.getPixelColor(x1 + x, y);
        const color2 = img2.getPixelColor(x2 + x, y);
        const gray1 = Jimp.intToRGBA(color1).r;
        const gray2 = Jimp.intToRGBA(color2).r;
        diff += Math.abs(gray1 - gray2);
      }
    }
    const normDiff = diff / (overlap * Math.min(img1.bitmap.height, img2.bitmap.height));
    if (normDiff < bestScore) {
      bestScore = normDiff;
      bestOffset = overlap;
    }
  }

  return { dx: img1.bitmap.width - bestOffset, dy: 0 };
}

/**
 * Blend two images using simple overlay with the provided translation.
 */
function blendImages(base: Jimp, overlay: Jimp, dx: number, dy: number): Jimp {
  const newWidth = Math.max(base.bitmap.width, dx + overlay.bitmap.width);
  const newHeight = Math.max(base.bitmap.height, dy + overlay.bitmap.height);
  const result = new Jimp(newWidth, newHeight, 0xffffffff);
  result.composite(base, 0, 0);
  result.composite(overlay, dx, dy, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 1,
    opacityDest: 1,
  });
  return result;
}

/**
 * Stitch a series of images into a panorama using feature detection,
 * homography estimation and cylindrical projection.
 */
export async function stitchPhotos(imageUris: string[]): Promise<string> {
  if (imageUris.length === 0) {
    throw new Error('No images to stitch');
  }

  const images = await Promise.all(imageUris.map(uri => Jimp.read(uri)));
  const projected = images.map((img: Jimp) => applyCylindricalProjection(img));

  let panorama = projected[0];

  for (let i = 1; i < projected.length; i++) {
    const next = projected[i];
    const features1 = detectFeatures(panorama);
    const features2 = detectFeatures(next);
    const { dx, dy } = estimateHomography(panorama, next, features1, features2);
    panorama = blendImages(panorama, next, dx, dy);
  }

  const outputPath = join(tmpdir(), `panorama_${Date.now()}.jpg`);
  await panorama.quality(90).writeAsync(outputPath);
  return outputPath;
}

export default stitchPhotos;
