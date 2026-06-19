import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File operations
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  clearData: () => ipcRenderer.invoke('clear-data'),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  
  // Platform info
  platform: process.platform
});
