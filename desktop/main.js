'use strict';

const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ICONS = path.join(ROOT, 'icons');
const TOOLBAR_H = 46;

const INJECT_FILES = ['core.js', 'adapters.js', 'runtime.js', 'panel.js', 'desktop-inject.js'];

const PLATFORMS = {
  claude: { name: 'Claude', url: 'https://claude.ai/new' },
  gemini: { name: 'Gemini', url: 'https://gemini.google.com/app' },
  kimi: { name: 'Kimi', url: 'https://www.kimi.com' },
  perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/' },
  copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com/' },
  grok: { name: 'Grok', url: 'https://grok.com/' }
};

const DEFAULTS = {
  defaultPlatform: 'claude',
  platforms: {
    claude: true,
    gemini: true,
    kimi: true,
    perplexity: true,
    copilot: true,
    grok: true,
    generic: true
  },
  minLevel: 1
};

const isSmoke = process.argv.includes('--smoke');

const settingsPath = () => path.join(app.getPath('userData'), 'ct-settings.json');

function loadSettings() {
  try {
    const data = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
    return Object.assign({}, DEFAULTS, data);
  } catch (e) {
    return Object.assign({}, DEFAULTS);
  }
}

function saveSettings(s) {
  fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2), 'utf8');
}

function dataUriOf(png) {
  const b = fs.existsSync(png) ? fs.readFileSync(png) : null;
  return b ? 'data:image/png;base64,' + b.toString('base64') : '';
}

let bundle = null;

function buildBundle() {
  if (bundle) return bundle;
  const settings = loadSettings();
  const pre =
    'window.__CT_SETTINGS__ = ' + JSON.stringify(settings) + ';\n' +
    'window.__CT_ICON__ = ' + JSON.stringify(dataUriOf(path.join(ICONS, 'icon16.png'))) + ';\n' +
    'window.__CT_PLATFORM__ = ' + JSON.stringify(settings.defaultPlatform) + ';\n';
  const body = INJECT_FILES.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
  bundle = pre + '\n;\n' + body;
  return bundle;
}

let win = null;
let view = null;

function chatUrl() {
  const s = loadSettings();
  const p = PLATFORMS[s.defaultPlatform];
  return p ? p.url : PLATFORMS.claude.url;
}

function injectionBundle() {
  buildBundle();
  return bundle;
}

function injectInto(wc) {
  try {
    wc.executeJavaScript(injectionBundle(), false).catch(() => {});
  } catch (e) {}
}

function injectIntoFrames(wc) {
  injectInto(wc);
  try {
    const frames = wc.mainFrame ? wc.mainFrame.frames : [];
    for (const f of frames) {
      try {
        wc.executeJavaScriptInFrame(f.frameId, injectionBundle(), false);
      } catch (e) {}
    }
  } catch (e) {}
}

function sendState() {
  if (!win || win.isDestroyed() || !view) return;
  const wc = view.webContents;
  const nav =
    wc.navigationHistory && typeof wc.navigationHistory.canGoBack === 'function'
      ? { back: wc.navigationHistory.canGoBack(), fwd: wc.navigationHistory.canGoForward() }
      : { back: wc.canGoBack(), fwd: wc.canGoForward() };
  win.webContents.send('state', {
    url: wc.getURL(),
    title: wc.getTitle(),
    canGoBack: nav.back,
    canGoForward: nav.fwd,
    platform: loadSettings().defaultPlatform
  });
}

function relayout() {
  if (!win || win.isDestroyed() || !view) return;
  const [w, h] = win.getContentSize();
  view.setBounds({ x: 0, y: TOOLBAR_H, width: w, height: Math.max(0, h - TOOLBAR_H) });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    show: !isSmoke,
    icon: path.join(ICONS, 'icon128.png'),
    webPreferences: {
      preload: path.join(__dirname, 'shell-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'shell.html'));

  view = new WebContentsView({
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  win.contentView.addChildView(view);

  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  try {
    view.webContents.setUserAgent(ua);
  } catch (e) {}

  view.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  view.webContents.on('did-finish-load', () => {
    injectIntoFrames(view.webContents);
    sendState();
  });
  view.webContents.on('did-frame-navigate', (e, url, isMainFrame) => {
    if (!isMainFrame) setTimeout(() => injectIntoFrames(view.webContents), 400);
    else sendState();
  });
  view.webContents.on('did-navigate-in-page', sendState);
  view.webContents.on('page-title-updated', sendState);

  view.webContents.loadURL(isSmoke ? smokeFixtureUrl() : chatUrl());

  win.on('resize', relayout);
  win.on('maximize', relayout);
  win.on('unmaximize', relayout);
  win.on('enter-full-screen', relayout);
  win.on('leave-full-screen', relayout);

  relayout();
}

function reloadChat() {
  if (view && !view.webContents.isDestroyed()) {
    bundle = null;
    view.webContents.reload();
  }
}

function openSettings() {
  const s = new BrowserWindow({
    width: 460,
    height: 620,
    resizable: false,
    parent: win,
    modal: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  s.loadFile(path.join(__dirname, 'settings.html'));
}

function registerIpc() {
  ipcMain.on('nav', (e, action) => {
    if (!view) return;
    const wc = view.webContents;
    if (action === 'back') wc.goBack();
    else if (action === 'forward') wc.goForward();
    else if (action === 'reload') wc.reload();
    else if (action === 'home') wc.loadURL(chatUrl());
    else if (action === 'devtools') {
      if (wc.isDevToolsOpened()) wc.closeDevTools();
      else wc.openDevTools({ mode: 'detach' });
    }
    sendState();
  });

  ipcMain.handle('get-state', sendState);

  ipcMain.on('open-external', () => {
    if (view) shell.openExternal(view.webContents.getURL());
  });

  ipcMain.on('open-settings', openSettings);

  ipcMain.on('set-platform', (e, id) => {
    if (!PLATFORMS[id]) return;
    const s = loadSettings();
    s.defaultPlatform = id;
    saveSettings(s);
    bundle = null;
    if (view) view.webContents.loadURL(PLATFORMS[id].url);
    sendState();
  });

  ipcMain.handle('settings-get', () => loadSettings());

  ipcMain.on('settings-save', (e, s) => {
    const merged = Object.assign({}, loadSettings(), s);
    saveSettings(merged);
    bundle = null;
    reloadChat();
  });
}

app.requestSingleInstanceLock();

function smokeFixtureUrl() {
  return 'file://' + path.join(__dirname, 'fixtures', 'smoke.html').replace(/\\/g, '/');
}

function runSmoke() {
  let tries = 0;
  const probe = "JSON.stringify((function(){var ms=window.CT.adapters.buildMessages({});return{mounted:!!document.querySelector('#ct-host'),rows:ms.length,kids:ms.reduce(function(n,m){return n+m.flat.length},0)};})())";
  const timer = setInterval(async () => {
    tries++;
    let res = null;
    try {
      res = await view.webContents.executeJavaScript(probe);
    } catch (e) {}
    if (res) {
      let r = null;
      try {
        r = JSON.parse(res);
      } catch (e) {}
      if (r && r.mounted) {
        const ok = r.rows >= 2 && r.kids >= 2;
        console.log('SMOKE_' + (ok ? 'OK' : 'FAIL') + ' ' + res);
        clearInterval(timer);
        app.exit(ok ? 0 : 1);
        return;
      }
    }
    if (tries > 30) {
      console.log('SMOKE_FAIL timeout ' + (res || 'no result'));
      clearInterval(timer);
      app.exit(1);
    }
  }, 800);
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (isSmoke) runSmoke();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});