const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// 设置桌面端独立数据目录，防止和临时目录混淆
const desktopDataDir = path.join(app.getPath('appData'), 'PuzzleEditorDesktop');
app.setPath('userData', desktopDataDir);

function setupMenu() {
  const template = [
    {
      label: '数据同步',
      submenu: [
        {
          label: '📥 一键导入浏览器备份文件 (.json)',
          click: async () => {
            if (!mainWindow) return;
            // 使用 Electron 原生文件选择对话框
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: '选择浏览器备份文件',
              filters: [{ name: 'JSON Backup', extensions: ['json'] }],
              properties: ['openFile']
            });

            if (canceled || !filePaths || filePaths.length === 0) return;

            try {
              const fileContent = fs.readFileSync(filePaths[0], 'utf8');
              const data = JSON.parse(fileContent);

              await mainWindow.webContents.executeJavaScript(`
                (async () => {
                  const data = ${JSON.stringify(data)};
                  if (data.localStorage) {
                    for (const [k, v] of Object.entries(data.localStorage)) {
                      localStorage.setItem(k, v);
                    }
                  }
                  if (data.indexedDB) {
                    for (const [dbName, stores] of Object.entries(data.indexedDB)) {
                      await new Promise((res) => {
                        const req = indexedDB.open(dbName);
                        req.onsuccess = (ev) => {
                          const db = ev.target.result;
                          const existingStores = Array.from(db.objectStoreNames);
                          const matchedStores = Object.keys(stores).filter(s => existingStores.includes(s));
                          if (matchedStores.length === 0) { db.close(); return res(); }
                          const tx = db.transaction(matchedStores, 'readwrite');
                          for (const storeName of matchedStores) {
                            const store = tx.objectStore(storeName);
                            const records = stores[storeName];
                            if (Array.isArray(records)) {
                              records.forEach(r => store.put(r));
                            }
                          }
                          tx.oncomplete = () => { db.close(); res(); };
                          tx.onerror = () => { db.close(); res(); };
                        };
                        req.onerror = () => res();
                      });
                    }
                  }
                  alert('🎉 数据导入完成！页面即将自动刷新生效。');
                  window.location.reload();
                })();
              `);
            } catch (err) {
              dialog.showErrorBox('导入失败', err.message);
            }
          }
        },
        {
          label: '📤 备份当前单机版数据 (.json)',
          click: async () => {
            if (!mainWindow) return;
            const dataStr = await mainWindow.webContents.executeJavaScript(`
              (async () => {
                const data = { localStorage: {}, indexedDB: {}, exportTime: new Date().toISOString() };
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k) data.localStorage[k] = localStorage.getItem(k);
                }
                const exportDB = (dbName) => new Promise((resolve) => {
                  const req = indexedDB.open(dbName);
                  req.onerror = () => resolve(null);
                  req.onsuccess = (e) => {
                    const db = e.target.result;
                    const storeNames = Array.from(db.objectStoreNames);
                    if (storeNames.length === 0) { db.close(); return resolve(null); }
                    const tx = db.transaction(storeNames, 'readonly');
                    const dbData = {};
                    let remaining = storeNames.length;
                    storeNames.forEach(name => {
                      const store = tx.objectStore(name);
                      const getAll = store.getAll ? store.getAll() : null;
                      if (getAll) {
                        getAll.onsuccess = () => { dbData[name] = getAll.result; if (--remaining === 0) { db.close(); resolve(dbData); } };
                        getAll.onerror = () => { if (--remaining === 0) { db.close(); resolve(dbData); } };
                      } else {
                        if (--remaining === 0) { db.close(); resolve(dbData); }
                      }
                    });
                  };
                });
                const [pasture, customMat, blockMat] = await Promise.all([
                  exportDB('pasture_assets_db'),
                  exportDB('custom_materials_db'),
                  exportDB('block_materials')
                ]);
                if (pasture) data.indexedDB['pasture_assets_db'] = pasture;
                if (customMat) data.indexedDB['custom_materials_db'] = customMat;
                if (blockMat) data.indexedDB['block_materials'] = blockMat;
                return JSON.stringify(data);
              })();
            `);

            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
              title: '保存备份文件',
              defaultPath: `puzzle-desktop-backup-${Date.now()}.json`,
              filters: [{ name: 'JSON Backup', extensions: ['json'] }]
            });

            if (!canceled && filePath) {
              fs.writeFileSync(filePath, dataStr, 'utf8');
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: '备份成功！文件已保存到本地。'
              });
            }
          }
        },
        { type: 'separator' },
        { label: '刷新页面 (F5)', role: 'reload' },
        { label: '强制刷新 (Ctrl+F5)', role: 'forceReload' },
        { label: '开发者工具 (F12)', role: 'toggleDevTools' },
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    title: 'Jewel Sliding - Block Puzzle Editor',
    icon: path.join(__dirname, '../app-icon-square.png'),
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    show: false,
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
