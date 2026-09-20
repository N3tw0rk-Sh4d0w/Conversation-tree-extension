'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ct', {
  nav: (action) => ipcRenderer.send('nav', action),
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (cb) => ipcRenderer.on('state', (e, s) => cb(s)),
  openExternal: () => ipcRenderer.send('open-external'),
  openSettings: () => ipcRenderer.send('open-settings'),
  setPlatform: (id) => ipcRenderer.send('set-platform', id),
  getSettings: () => ipcRenderer.invoke('settings-get'),
  saveSettings: (s) => ipcRenderer.send('settings-save', s)
});