// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('goalsAPI', {
    askGoals: (params) => ipcRenderer.send('ask-goals',params),
    getGoals: (func) => ipcRenderer.on('get-goals', (event, data) => func(data)),
    newGoal: (params) => ipcRenderer.send('new-goal',params),
    removingGoal: (callback) => ipcRenderer.on("removing-goal", callback),
    goalRemoved : (params) => ipcRenderer.send('goal-removed', params),
    rowsChange: (params) => ipcRenderer.send('rows-change',params),
    changeChecks: (params) => ipcRenderer.send('change-checks', params)
})


contextBridge.exposeInMainWorld('sidebarAPI', {
    askHistory: (params) => ipcRenderer.send('ask-history',params),
    getHistory: (func) => ipcRenderer.on('get-history', (event, data) => func(data)),
    deleteHistory: (params) => ipcRenderer.send('delete-history', params),
    changeChecks: (params) => ipcRenderer.send('side-check-change', params),

    askIdeas: (params) => ipcRenderer.send('ask-ideas',params),
    getIdeas: (func) => ipcRenderer.on('get-ideas', (event, data) => func(data)),
    deleteIdea: (params) => ipcRenderer.send('delete-ideas', params),
    newIdea: (params) => ipcRenderer.send('new-idea',params),
})
