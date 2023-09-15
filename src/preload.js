// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron')
contextBridge.exposeInMainWorld('electronAPI', {
    getData: (params) => ipcRenderer.send('get-data',params), // This sends a message to the main process
    receiveData: (func) => ipcRenderer.on('receive-data', (event, data) => func(data)) // This receives a message from the main process
})

contextBridge.exposeInMainWorld('electronAPI2', {
    sendData: (params) => ipcRenderer.send('send-data',params), // This sends a message to the main process
})