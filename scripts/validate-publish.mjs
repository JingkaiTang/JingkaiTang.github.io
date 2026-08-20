/**
 * Pre-publish Validation Script
 * Validates draft files before publishing:
 * - Required frontmatter (title, description)
 * - Cover image exists
 * - Image paths are valid
 * - No draft flag
 * 
 * Usage: node scripts/validate-publish.mjs [slug]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const writingDir = path.join(rootDir, 'src/content/writing');
const publicDir = path.join(rootDir, 'public');

const errors = [];
const warnings = [];

export function resolveLocalAssetPath(assetPath, sourceFile) {
  const pathOnly = assetPath.split(/[?#]/, 1)[0];
  let decodedPath = pathOnly;

  try {
    decodedPath = decodeURIComponent(pathOnly);
  } catch {
    // Keep the original path so malformed URLs are reported as missing files.
  }

  if (decodedPath.startsWith('/')) {
    return path.join(publicDir, decodedPath.replace(/^\/+/, ''));
  }

  return path.resolve(path.dirname(sourceFile), decodedPath);
}

function validateFrontmatter(file, data) {
  const { data: frontmatter } = matter(file);
  
  // Check required fields
  if (!frontmatter.title) {
    errors.push(`[${data.slug}] 缺少 title`);
  } else if (frontmatter.title.length > 100) {
    warnings.push(`[${data.slug}] title 过长 (${frontmatter.title.length} 字符，建议 <100)`);
  }
  
  if (!frontmatter.description) {
    warnings.push(`[${data.slug}] 缺少 description (影响 SEO 和分享预览)`);
  }
  
  // Check draft flag
  if (frontmatter.draft) {
    errors.push(`[${data.slug}] 仍然是草稿 (draft: true)`);
  }
  
  // Check pubDate
  if (!frontmatter.pubDate) {
    errors.push(`[${data.slug}] 缺少 pubDate`);
  }
  
  return frontmatter;
}

function validateCover(file, frontmatter, data) {
  if (!frontmatter.cover) return;
  
  const coverPath = resolveLocalAssetPath(frontmatter.cover, data.filePath);
  if (!fs.existsSync(coverPath)) {
    errors.push(`[${data.slug}] 封面图片不存在：${frontmatter.cover}`);
  } else {
    const stats = fs.statSync(coverPath);
    if (stats.size > 1024 * 1024) { // 1MB
      warnings.push(`[${data.slug}] 封面图片较大 (${Math.round(stats.size / 1024)}KB，建议压缩)`);
    }
  }
}

function validateImages(file, data) {
  const content = file.toString();
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1].trim();
    const imagePath = match[2];

    if (!alt) {
      warnings.push(`[${data.slug}] 图片缺少替代文本：${imagePath}`);
    }
    
    // Skip external images
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      continue;
    }
    
    // Check if local image exists
    const fullPath = resolveLocalAssetPath(imagePath, data.filePath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`[${data.slug}] 图片不存在：${imagePath}`);
    }
  }
}

async function validatePost(slug) {
  // Find the post directory
  let postDir = path.join(writingDir, slug);
  if (!fs.existsSync(postDir)) {
    // Try without slug (search all posts)
    const dirs = fs.readdirSync(writingDir);
    for (const dir of dirs) {
      const dirPath = path.join(writingDir, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const indexFile = path.join(dirPath, 'index.md');
        if (fs.existsSync(indexFile)) {
          const content = fs.readFileSync(indexFile, 'utf-8');
          const { data } = matter(content);
          const postSlug = data.slug || dir;
          if (postSlug === slug || dir === slug) {
            postDir = dirPath;
            break;
          }
        }
      }
    }
  }
  
  if (!fs.existsSync(postDir)) {
    console.error(`❌ 找不到文章：${slug}`);
    return false;
  }
  
  const indexFile = path.join(postDir, 'index.md');
  if (!fs.existsSync(indexFile)) {
    errors.push(`[${slug}] index.md 不存在`);
    return false;
  }
  
  const content = fs.readFileSync(indexFile, 'utf-8');
  const { data } = matter(content);
  const fileData = { slug, filePath: indexFile };
  
  const frontmatter = validateFrontmatter(content, fileData);
  validateCover(content, frontmatter, fileData);
  validateImages(content, fileData);
  
  return true;
}

async function validateAll() {
  const dirs = fs.readdirSync(writingDir);
  
  for (const dir of dirs) {
    const dirPath = path.join(writingDir, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    
    const indexFile = path.join(dirPath, 'index.md');
    if (!fs.existsSync(indexFile)) continue;
    
    const content = fs.readFileSync(indexFile, 'utf-8');
    const { data } = matter(content);
    
    // Skip if draft
    if (data.draft) continue;
    
    const fileData = { slug: data.slug || dir, filePath: indexFile };
    const frontmatter = validateFrontmatter(content, fileData);
    validateCover(content, frontmatter, fileData);
    validateImages(content, fileData);
  }
}

async function main() {
  const slug = process.argv[2];
  
  console.log('🔍 发布前校验...\n');
  
  if (slug) {
    await validatePost(slug);
  } else {
    await validateAll();
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ 校验通过，可以发布！\n');
    return;
  }
  
  if (errors.length > 0) {
    console.log('❌ 错误 (必须修复):\n');
    for (const error of errors) {
      console.log(`  • ${error}`);
    }
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  警告 (建议修复):\n');
    for (const warning of warnings) {
      console.log(`  • ${warning}`);
    }
    console.log('');
  }
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
