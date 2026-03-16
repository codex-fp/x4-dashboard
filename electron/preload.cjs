const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('x4Desktop', {
  isDesktop: true,
})
