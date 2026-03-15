/**
 * Image Compression Script
 * Compresses images >500KB in the content directories
 * Usage: node scripts/compress-images.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Directories to scan for images
const IMAGE_DIRS = [
  path.join(rootDir, 'src/content/writing'),
  path.join(rootDir, 'src/content/now'),
  path.join(rootDir, 'public/images'),
];

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const SIZE_THRESHOLD_KB = 500;
const QUALITY = 80; // Compression quality (1-100)

const dryRun = process.argv.includes('--dry-run');

async function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024); // KB
}

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  
  // For JPEG/JPG, compress as JPEG
  // For PNG, compress as PNG with optimization
  // For WebP, compress as WebP
  if (['.jpg', '.jpeg'].includes(ext)) {
    await sharp(filePath)
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(path.join(outputDir, `${baseName}.jpg`));
  } else if (ext === '.png') {
    await sharp(filePath)
      .png({ quality: QUALITY, compressionLevel: 7 })
      .toFile(path.join(outputDir, `${baseName}.png`));
  } else if (ext === '.webp') {
    await sharp(filePath)
      .webp({ quality: QUALITY })
      .toFile(path.join(outputDir, `${baseName}.webp`));
  }
  
  return getFileSize(path.join(outputDir, baseName + ext));
}

async function findLargeImages() {
  const largeImages = [];
  
  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir, { recursive: true });
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (!fs.statSync(filePath).isFile()) continue;
      
      const ext = path.extname(file).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
      
      const sizeKB = getFileSize(filePath);
      if (sizeKB > SIZE_THRESHOLD_KB) {
        largeImages.push({ path: filePath, sizeKB });
      }
    }
  }
  
  return largeImages;
}

async function main() {
  console.log('🔍 扫描图片...\n');
  
  const largeImages = await findLargeImages();
  
  if (largeImages.length === 0) {
    console.log('✅ 没有发现大于 500KB 的图片');
    return;
  }
  
  console.log(`发现 ${largeImages.length} 张大图 (>500KB):\n`);
  
  let totalSaved = 0;
  
  for (const img of largeImages) {
    const relativePath = path.relative(rootDir, img.path);
    console.log(`📷 ${relativePath} (${img.sizeKB}KB)`);
    
    if (dryRun) {
      console.log('   ⏭️  跳过 (--dry-run)\n');
      continue;
    }
    
    try {
      const originalSize = img.sizeKB;
      const newSize = await compressImage(img.path);
      const saved = originalSize - newSize;
      const percent = Math.round((saved / originalSize) * 100);
      
      totalSaved += saved;
      console.log(`   ✅ 压缩后：${newSize}KB (节省 ${saved}KB / ${percent}%)\n`);
    } catch (error) {
      console.log(`   ❌ 压缩失败：${error.message}\n`);
    }
  }
  
  if (!dryRun && totalSaved > 0) {
    console.log(`\n🎉 完成！共节省 ${totalSaved}KB`);
  }
}

main().catch(console.error);
