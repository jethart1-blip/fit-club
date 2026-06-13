import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

const sizes = [192, 512];

for (const size of sizes) {
  await sharp('src/assets/icon.svg')
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}

// Maskable icon: same design with extra padding (10% safe zone)
await sharp('src/assets/icon.svg')
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 26, g: 29, b: 35, alpha: 1 } })
  .png()
  .toFile('public/icons/icon-maskable-512.png');
console.log('Generated icon-maskable-512.png');
