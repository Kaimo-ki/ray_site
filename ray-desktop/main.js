const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Конфигурация
const DIST_PATH = path.join(__dirname, 'ray_site');
const ICON_PATH = path.join(__dirname, 'icons', 'icon.png');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// --- Утилиты ---

function ensureDistFolder() {
  if (!fs.existsSync(DIST_PATH)) {
    fs.mkdirSync(DIST_PATH, { recursive: true });
    // Создаём минимальную страницу, если ray_site отсутствует
    fs.writeFileSync(
      path.join(DIST_PATH, 'index.html'),
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Рэй</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background: #07110f;
              color: #f4f7f5;
              font-family: system-ui, sans-serif;
            }
            main { text-align: center; padding: 24px; }
            h1 { color: #32d6b0; }
          </style>
        </head>
        <body>
          <main>
            <h1>Рэй</h1>
            <p>Загрузка...</p>
          </main>
        </body>
      </html>`
    );
  }
}

function getMimeType(ext) {
  const types = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.webmanifest': 'application/json',
    '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2'
  };
  return types[ext] || 'application/octet-stream';
}

// --- Регистрация протокола ---

function registerProtocol() {
  const { protocol } = require('electron');
  protocol.handle('ray', (request) => {
    const url = new URL(request.url);
    const filePath = url.pathname.replace(/^\//, '');
    const fullPath = path.join(DIST_PATH, filePath);
    
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': getMimeType(path.extname(fullPath)) }
      });
    }
    return new Response('Not found', { status: 404 });
  });
}

// --- Создание окна ---

function createWindow() {
  const icon = fs.existsSync(ICON_PATH) ? ICON_PATH : undefined;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#07110f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon,
    show: false
  });

  // Загружаем локальную версию
  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('https://kaimo-ki.github.io/ray_site/');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Проверка обновлений (только в собранной версии)
    if (app.isPackaged) {
      setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 3000);
    }
  });

  // Открываем внешние ссылки в браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Сворачивание в трей вместо закрытия
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  createMenu();
  createTray();

  return mainWindow;
}

// --- Меню ---

function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'О Рэе' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Новое окно',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        },
        { type: 'separator' },
        {
          label: 'Открыть в браузере',
          click: () => shell.openExternal('https://kaimo-ki.github.io/ray_site/')
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Рэй',
      submenu: [
        {
          label: 'Показать окно',
          click: () => mainWindow?.show() || createWindow()
        },
        {
          label: 'Скрыть окно',
          click: () => mainWindow?.hide()
        },
        { type: 'separator' },
        {
          label: 'Проверить обновления',
          click: () => {
            if (app.isPackaged) {
              autoUpdater.checkForUpdatesAndNotify();
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'Проверка обновлений...',
                detail: 'Приложение проверит наличие новых версий в фоновом режиме.'
              });
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'Режим разработки',
                detail: 'Обновления доступны только в собранной версии приложения.'
              });
            }
          }
        }
      ]
    },
    {
      label: 'Помощь',
      submenu: [
        {
          label: 'GitHub',
          click: () => shell.openExternal('https://github.com/Kaimo-ki/ray_site')
        },
        {
          label: 'Telegram',
          click: () => shell.openExternal('https://t.me/rey_helper_bot')
        }
      ]
    }
  ];

  // Windows: добавляем пункт "Выход"
  if (process.platform === 'win32') {
    template.unshift({
      label: 'Рэй',
      submenu: [{ role: 'quit', label: 'Выход' }]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- Трей ---

function createTray() {
  if (!fs.existsSync(ICON_PATH)) return;

  tray = new Tray(ICON_PATH);
  tray.setToolTip('Рэй — персональный AI-помощник');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать Рэя',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Скрыть',
      click: () => mainWindow?.hide()
    },
    { type: 'separator' },
    {
      label: 'Выйти',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// --- IPC Handlers ---

ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('is-packaged', () => app.isPackaged);

// --- Auto Updater ---

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновление',
    message: 'Доступна новая версия Рэя',
    detail: 'Обновление будет загружено в фоновом режиме.'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Готово к установке',
    message: 'Обновление загружено',
    detail: 'Перезапустите приложение для установки обновления.',
    buttons: ['Перезапустить', 'Позже']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// --- App Lifecycle ---

app.on('ready', () => {
  ensureDistFolder();
  registerProtocol();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// --- Single Instance Lock ---

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}