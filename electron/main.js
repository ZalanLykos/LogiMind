import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Electron main.js starting...');
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

const DB_FILE = path.join(__dirname, '..', 'Database.json');
const SERVER_URL = 'http://localhost:3000';
console.log('DB_FILE:', DB_FILE);
console.log('SERVER_URL:', SERVER_URL);

let mainWindow;
let serverProcess;

async function ensureServerRunning() {
  // Check if server is already running
  try {
    const response = await fetch(`${SERVER_URL}/api/data`);
    if (response.ok) {
      console.log('Server already running on port 3000');
      return true;
    }
  } catch (e) {
    console.log('Server not running, starting...');
  }
  
  const serverPath = path.join(__dirname, '..', 'server.js');
  console.log('Starting server:', serverPath);
  
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout after 10s'));
    }, 10000);
    
    const checkServer = setInterval(async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/data`);
        if (response.ok) {
          clearInterval(checkServer);
          clearTimeout(timeout);
          console.log('Server started successfully');
          resolve(true);
        }
      } catch (e) {
        // Server not ready yet
      }
    }, 500);
  });
}

function createWindow() {
  console.log('Creating window...');
  
  // Calculate paths
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  
  console.log('Preload path:', preloadPath);
  console.log('Index path:', indexPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'LogiMind - Logistics Intelligence Platform',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false // Don't show until loaded
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading from Vite dev server:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading from file:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // Handle load failure
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}] ${message}`);
  });
}

// IPC Handlers - delegate to Express server for data operations

async function serverRequest(endpoint, method = 'GET', body) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${SERVER_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Server request failed (${endpoint}):`, error);
    // Fallback to direct file operations if server is not available
    return fallbackFileOperation(endpoint, method, body);
  }
}

async function fallbackFileOperation(endpoint, method, body) {
  if (endpoint === '/api/data' && method === 'GET') {
    try {
      const exists = await fs.access(DB_FILE).then(() => true).catch(() => false);
      if (!exists) return [];
      const data = await fs.readFile(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Fallback load error:', error);
      return [];
    }
  }
  if (endpoint === '/api/save' && method === 'POST') {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(body?.data, null, 2));
      return { success: true, message: 'Data saved to Database.json' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  if (endpoint === '/api/clear' && method === 'POST') {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
      return { success: true, message: 'Database cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

// Save data
ipcMain.handle('save-data', async (event, data) => {
  return await serverRequest('/api/save', 'POST', { data });
});

// Load data
ipcMain.handle('load-data', async () => {
  return await serverRequest('/api/data', 'GET');
});

// Clear data
ipcMain.handle('clear-data', async () => {
  return await serverRequest('/api/clear', 'POST');
});

// Get database file path
ipcMain.handle('get-db-path', () => {
  return DB_FILE;
});

app.whenReady().then(async () => {
  console.log('App ready');
  try {
    await ensureServerRunning();
  } catch (err) {
    console.error('Failed to start server:', err);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (serverProcess) {
    serverProcess.kill();
    console.log('Server process killed');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
