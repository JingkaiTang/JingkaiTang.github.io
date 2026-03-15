#!/usr/bin/env node
/**
 * 定时任务：每天凌晨 2 点更新 GitHub Pins
 * 
 * 功能：
 * 1. 拉取最新 main 分支
 * 2. 运行 fetch-github-pins.mjs
 * 3. 如果有变更，提交并推送
 * 
 * 部署方式（crontab -e）：
 * 0 2 * * * cd /path/to/repo && /usr/bin/node scripts/cron-update-pins.mjs >> logs/cron-pins.log 2>&1
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`❌ 命令失败：${cmd}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

function main() {
  console.log(`\n=== GitHub Pins 定时更新 (${new Date().toISOString()}) ===`);

  // 1. 拉取最新 main
  console.log('📥 拉取最新 main 分支...');
  run('git checkout main');
  run('git pull --ff-only');

  // 2. 运行更新脚本
  console.log('🔄 运行 fetch-github-pins.mjs...');
  run('npm run update:pins');

  // 3. 检查是否有变更
  console.log('🔍 检查变更...');
  const status = run('git status --porcelain src/data/github-pins.json');
  
  if (!status.trim()) {
    console.log('✅ 无变更，跳过提交');
    return;
  }

  // 4. 提交并推送
  console.log('📝 提交变更...');
  const date = new Date().toISOString().split('T')[0];
  run(`git add src/data/github-pins.json`);
  run(`git commit -m "chore(cron): 更新 GitHub Pins (${date})"`);
  
  console.log('🚀 推送到远程...');
  run('git push origin main');

  console.log('✅ 更新完成！');
}

main();
