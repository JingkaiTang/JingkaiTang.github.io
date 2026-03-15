/**
 * Preview with LAN address
 * Starts Astro preview server and displays LAN address for remote access
 * Usage: node scripts/preview-lan.mjs [--port 4321]
 */

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Get LAN IP address
function getLANIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Parse arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : '4321';

console.log('🚀 启动预览服务器...\n');

// Start Astro preview
const preview = spawn('npm', ['run', 'preview', '--', '--port', port, '--host'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
});

// Wait a bit then show LAN address
setTimeout(() => {
  const lanIP = getLANIP();
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📡 预览地址');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  本地：   http://localhost:${port}`);
  console.log(`  局域网： http://${lanIP}:${port}`);
  console.log('');
  console.log('  💡 提示：在同一局域网的设备上可以使用');
  console.log('     局域网地址访问预览站点');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n');
}, 2000);

preview.on('exit', (code) => {
  process.exit(code || 0);
});

preview.on('error', (err) => {
  console.error('❌ 启动失败:', err.message);
  process.exit(1);
});
