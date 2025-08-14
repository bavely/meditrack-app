require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert');
const { stitchPhotos } = require('../utils/photoStitchingScanner');
const Jimp = require('jimp');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

async function countTextSegments(imagePath) {
  const img = await Jimp.read(imagePath);
  const segmentWidth = 40; // approx width per character
  const segments = Math.floor(img.bitmap.width / segmentWidth);
  let count = 0;
  for (let i = 0; i < segments; i++) {
    let darkPixels = 0;
    img.scan(i * segmentWidth, 0, segmentWidth, img.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 250) darkPixels++;
    });
    if (darkPixels > segmentWidth * img.bitmap.height * 0.1) {
      count++;
    }
  }
  return count;
}

test('stitching multiple images yields higher text coverage', async () => {
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const base = new Jimp(400, 100, 0xffffffff);
  base.print(font, 10, 30, 'HELLO WORLD');

  const img1 = base.clone().crop(0, 0, 250, 100);
  const img2 = base.clone().crop(150, 0, 250, 100);

  const path1 = join(tmpdir(), 'frame1.jpg');
  const path2 = join(tmpdir(), 'frame2.jpg');
  await img1.quality(90).writeAsync(path1);
  await img2.quality(90).writeAsync(path2);

  const panoramaPath = await stitchPhotos([path1, path2]);

  const seg1 = await countTextSegments(path1);
  const seg2 = await countTextSegments(path2);
  const segPan = await countTextSegments(panoramaPath);

  const maxIndividual = Math.max(seg1, seg2);
  assert.ok(segPan > maxIndividual, 'panorama should contain more text segments');
});
