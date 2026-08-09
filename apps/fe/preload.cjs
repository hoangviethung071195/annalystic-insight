const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  apiBaseUrl: ipcRenderer.sendSync('get-api-base-url'),
  launchBrowser: () => ipcRenderer.invoke('launch-browser'),
  getCrawlerStatus: () => ipcRenderer.invoke('get-crawler-status'),
  runCrawl: (groupUrl, limitPosts, token) => ipcRenderer.invoke('run-crawl', { groupUrl, limitPosts, token }),
});
