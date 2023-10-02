// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getData: (params) => ipcRenderer.send('get-data',params), // This sends a message to the main process
    receiveData: (func) => ipcRenderer.on('receive-data', (event, data) => func(data)) // This receives a message from the main process
})

contextBridge.exposeInMainWorld('electronAPI2', {
    sendData: (params) => ipcRenderer.send('send-data',params),
})

contextBridge.exposeInMainWorld('electronAPI3', {
    delete_task: (callback) => ipcRenderer.on("selectDiv", callback)
})

contextBridge.exposeInMainWorld('electronAPI4', {
    sendData: (params) => ipcRenderer.send('rows-change',params),
})

contextBridge.exposeInMainWorld('electronAPI5', {
    sendTasks: (params) => ipcRenderer.send('removeDiv', params)
})

contextBridge.exposeInMainWorld('electronAPI6', {
    sendChecks: (params) => ipcRenderer.send('change_checks', params)
})

contextBridge.exposeInMainWorld('electronAPI7', {
    getData: (params) => ipcRenderer.send('get-history',params), // This sends a message to the main process
    receiveData: (func) => ipcRenderer.on('receive-history', (event, data) => func(data)) // This receives a message from the main process
})

contextBridge.exposeInMainWorld('electronAPI8', {
    sendTasks: (params) => ipcRenderer.send('removeSidebar', params)
})

contextBridge.exposeInMainWorld('electronAPI9', {
    sendTasks: (params) => ipcRenderer.send('side_check_change', params)
})