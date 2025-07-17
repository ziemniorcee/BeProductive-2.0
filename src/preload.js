// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron')


contextBridge.exposeInMainWorld('goalsAPI', {
    removingGoal: (callback) => ipcRenderer.on("removing-goal", callback), // must stay

    askProductivity: (params) => ipcRenderer.send('ask-productivity', params),
    getProductivity: (func) => ipcRenderer.on('get-productivity', (event, productivities) => func(productivities)),

    askCategoriesCounts: () => ipcRenderer.send('ask-categories-counts'),
    getCategoriesCounts: (func) => ipcRenderer.on('get-categories-counts', (event, counts) => func(counts)),

    // askGalacticConnections: () => ipcRenderer.send('ask-galactic-conn'),
    // getGalacticConnections: (func) => ipcRenderer.on('get-galactic-conn', (event, connections) => func(connections)),

    changeProjectCoords: (params) => ipcRenderer.send('change-projects-coords', params),
    changeGalacticConnections: (params) => ipcRenderer.send('change-galactic-connections', params),

    addHabit: (params) => ipcRenderer.invoke('add-habit', params),
    addHabitDays: (params) => ipcRenderer.send('add-habit-days', params),
    addHabitLogs: (params) => ipcRenderer.send('add-habit-logs', params),

    removeHabit: (params) => ipcRenderer.send('remove-habit', params),
    removeHabitLogs: (params) => ipcRenderer.send('remove-habit-logs', params),

    // askHabits: () => ipcRenderer.send('ask-habits'),
    // getHabits: (func) => ipcRenderer.on('get-habits', (event, habits) => func(habits)),

    // askHabitsDays: () => ipcRenderer.send('ask-habits-days'),
    // getHabitsDays: (func) => ipcRenderer.on('get-habits-days', (event, days) => func(days)),

    // askHabitsLogs: () => ipcRenderer.send('ask-habits-logs'),
    // getHabitsLogs: (func) => ipcRenderer.on('get-habits-logs', (event, days) => func(days)),
})

contextBridge.exposeInMainWorld('projectsAPI', {
    removeProject: (params) => ipcRenderer.send('remove-project', params), //niemoje
})


contextBridge.exposeInMainWorld('appAPI', { //stay
    contextMenuOpen: (params) => ipcRenderer.send('context-menu-open', params),

    changeWindow: (params) => ipcRenderer.send('change_window', params),
    startPosChange: (params) => ipcRenderer.send('start_pos_change', params),
    stopPosChange: (params) => ipcRenderer.send('stop_pos_change', params),

    showFloatbarMenu: (params) => ipcRenderer.send('show_floatbar_menu', params),
    showGoals: (params) => ipcRenderer.send('show_goals', params),
    returnState: (func) => ipcRenderer.on('return_state', (event, data) => func(data)),
})



contextBridge.exposeInMainWorld('dataAPI', {
    getGalacticConnections: () => ipcRenderer.invoke('get-galactic-connections'),
    getHabits: () => ipcRenderer.invoke('get-habits'),
    getHabitsDays: () => ipcRenderer.invoke('get-habits-days'),
    getHabitsLogs: () => ipcRenderer.invoke('get-habits-logs'),
});

