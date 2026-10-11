/**
 * Generate admin PWA icons from the uploaded logo image
 * Creates 192x192, 512x512, and maskable versions
 */
import sharp from 'sharp';
import fs from 'fs';

const SRC = 'C:/Users/LAPTOP OUTLET/AppData/Local/Temp/opencode/uploads/80234aec-ddd8-49b3-a62f-a8fedde95297/image.png';
const OUT_DIR = 'public';

async function generateIcons() {
  const srcImg = sharp(SRC);
  const meta = await srcImg.metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}`);

  // For PWA icons, we need square images. The source is landscape (1366x605).
  // We'll create square icons by cropping to center or fitting with background.
  // Let's create a square version by taking the center crop or adding padding.

  const sizes = [
    { size: 192, name: 'admin-icon-192.png' },
    { size: 512, name: 'admin-icon-512.png' },
    { size: 512, name: 'admin-icon-512-maskable.png' }, // maskable version
  ];

  for (const { size, name } of sizes) {
    let pipeline = sharp(SRC);
    
    // Resize to cover the square, then crop to center
    pipeline = pipeline.resize(size, size, {
      fit: 'cover',
      position: 'center',
    });

    // For maskable icon, add safe zone padding (20% from edges)
    if (name.includes('maskable')) {
      // For maskable icons, we need 40% safe zone (20% padding each side)
      // Resize to 80% of target size, then pad to full size
      const innerSize = Math.round(size * 0.8);
      const padding = (size - innerSize) / 2;
      
      pipeline = sharp(SRC)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 } // white background for maskable
        });
    }

    await pipeline
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(`${OUT_DIR}/${name}`);
    
    console.log(`Created: ${name} (${size}x${size})`);
  }

  // Also create apple-touch-icon (180x180)
  await sharp(SRC)
    .resize(180, 180, { fit: 'cover', position: 'center' })
    .png({ quality: 90 })
    .toFile(`${OUT_DIR}/admin-apple-touch-icon.png`);
  
  console.log('Created: admin-apple-touch-icon.png (180x180)');
  
  // Create favicon.ico (multiple sizes)
  await sharp(SRC)
    .resize(32, 32, { fit: 'cover', position: 'center' })
    .png()
    .toFile(`${OUT_DIR}/admin-favicon-32.png`);
    
  await sharp(SRC)
    .resize(16, 16, { fit: 'cover', position: 'center' })
    .png()
    .toFile(`${OUT_DIR}/admin-favicon-16.png`);
  
  console.log('Created favicon PNGs');

  // Verify created icons
  console.log('\nVerification:');
  for (const { size, name } of sizes) {
    const m = await sharp(`${OUT_DIR}/${name}`).metadata();
    console.log(`  ${name}: ${m.width}x${m.height}`);
  }
  
  const apple = await sharp(`${OUT_DIR}/admin-apple-touch-icon.png`).metadata();
  console.log(`  admin-apple-touch-icon.png: ${apple.width}x${apple.height}`);
}

generateIcons().catch(console.error);