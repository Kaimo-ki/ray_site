const { contextBridge, ipcRenderer } = require('electron');

// Экспонируем безопасные API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  isPackaged: () => ipcRenderer.invoke('is-packaged'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  }
});

// Сообщаем, что мы в Electron
contextBridge.exposeInMainWorld('isElectron', true);