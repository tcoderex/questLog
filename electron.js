import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 820,
    height: 800,
    minWidth: 500,
    minHeight: 650,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Enables window.require('electron') in renderer
    }
  });

  // Decide if we are running in dev mode or reading built files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000').catch(() => {
      setTimeout(() => {
        win.loadURL('http://localhost:3000').catch(() => {
          // Fallback load dist folder
          win.loadFile(path.join(__dirname, 'dist/index.html'));
        });
      }, 2000);
    });
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Handle close/minimize from IPC renderer events
  ipcMain.on('window-close', () => {
    if (win) win.close();
  });

  ipcMain.on('window-minimize', () => {
    if (win) win.minimize();
  });

  win.on('closed', () => {
    win = null;
  });
}

// Global App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
