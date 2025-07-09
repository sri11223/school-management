import { app, BrowserWindow } from 'electron';
import * as path from 'path';

class EduManageApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    app.whenReady().then(() => this.createWindow());
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      show: false
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
  }
}

new EduManageApp();