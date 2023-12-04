import { electronApp, ipcHelper, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, dialog, shell } from 'electron'
import { join } from 'path'
import puppeteer from 'puppeteer'
import icon from '../../resources/icon.png?asset'
import { PuppeteerResult } from '../types/globals'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let splashWindow: BrowserWindow | null = null
// ipcMain
const getFilePath = async (): Promise<string> => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: '投稿ファイルを選択',
    filters: [{ name: 'スケジュールファイル', extensions: ['csv'] }]
  })
  return filePaths[0]
}

const startXScheduling = async (filePath: string): Promise<PuppeteerResult> => {
  console.log(filePath)

  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://twitter.com')

  // Rest of your code...

  return { result: 'success', message: 'great' }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createSplashWindow(): void {
  // Create the browser window.
  splashWindow = new BrowserWindow({
    frame: false,
    width: 768,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  splashWindow.on('ready-to-show', () => {
    if (splashWindow) splashWindow.show()
  })

  splashWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/splash.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ipcMain
  ipcHelper.handle('get-file-path', getFilePath)
  ipcHelper.handle('start-x-scheduling', (_event, filePath) => startXScheduling(filePath))
  createSplashWindow()
  setTimeout(() => {
    splashWindow?.hide()
    createWindow()
    splashWindow?.close()
  }, 3000)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
