const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 5173;
const DEV_URL = `http://127.0.0.1:${PORT}`;

// 启动 Vite 开发服务
const viteProcess = spawn('npx.cmd', ['vite', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function pollServer(retries = 30) {
  http.get(DEV_URL, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log(`[Electron-Runner] Vite dev server ready at ${DEV_URL}`);
      startElectron();
    } else {
      retry();
    }
  }).on('error', () => {
    retry();
  });

  function retry() {
    if (retries <= 0) {
      console.error('[Electron-Runner] Timeout waiting for Vite server.');
      process.exit(1);
    }
    setTimeout(() => pollServer(retries - 1), 500);
  }
}

function startElectron() {
  const electronProcess = spawn('npx.cmd', ['electron', 'electron/main.cjs'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_URL,
    },
  });

  electronProcess.on('close', (code) => {
    viteProcess.kill();
    process.exit(code || 0);
  });
}

pollServer();
