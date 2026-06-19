import { spawn } from 'child_process';
import net from 'net';

const args = process.argv.slice(2);
const shouldLaunchElectron = args.includes('electron');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function ensureServerRunning() {
  const inUse = await isPortInUse(3000);
  if (inUse) {
    console.log('Server already running on port 3000');
    return null;
  }

  console.log('Starting Express server...');
  const server = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (err) => {
    console.error('Server process error:', err);
  });

  // Wait a bit for server to start
  await new Promise(r => setTimeout(r, 1500));
  console.log('Express server started on port 3000');
  return server;
}

async function main() {
  const serverProcess = await ensureServerRunning();

  if (!shouldLaunchElectron) {
    const vite = spawn('npx', ['vite'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    vite.on('exit', (code) => {
      if (serverProcess) serverProcess.kill();
      process.exit(code);
    });

    process.on('SIGINT', () => {
      vite.kill();
      if (serverProcess) serverProcess.kill();
      process.exit(0);
    });
  }

  if (shouldLaunchElectron) {
    const electron = spawn('electron', ['electron/main.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    electron.on('exit', (code) => {
      if (serverProcess) serverProcess.kill();
      process.exit(code);
    });

    process.on('SIGINT', () => {
      electron.kill();
      if (serverProcess) serverProcess.kill();
      process.exit(0);
    });
  }
}

main();