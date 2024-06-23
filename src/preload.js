// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('goalsAPI', {
    test: (params) => ipcRenderer.send('test', params),
    askGoals: (params) => ipcRenderer.send('ask-goals', params),
    getGoals: (func) => ipcRenderer.on('get-goals', (event, goals, steps) => func(goals, steps)),
    newGoal: (params) => ipcRenderer.send('new-goal', params),
    removingGoal: (callback) => ipcRenderer.on("removing-goal", callback),
    removingFollowing: (callback) => ipcRenderer.on("removing-following", callback),
    goalRemoved: (params) => ipcRenderer.send('goal-removed', params),
    followingRemoved: (params) => ipcRenderer.send('following-removed', params),
    getFollowingRemoved: (func) => ipcRenderer.on('get-following-removed', (event, positions) => func(positions)),
    rowsChange: (params) => ipcRenderer.send('rows-change', params),
    changeChecksGoal: (params) => ipcRenderer.send('change-checks-goal', params),
    changeChecksStep: (params) => ipcRenderer.send('change-checks-step', params),

    changeTextGoal: (params) => ipcRenderer.send('change-text-goal', params),
    addStep: (params) => ipcRenderer.send('add-step', params),
    changeStep: (params) => ipcRenderer.send('change-step', params),
    removeStep: (params) => ipcRenderer.send('remove-step', params),
    changeCategory: (params) => ipcRenderer.send('change-category', params),
    changeDifficulty: (params) => ipcRenderer.send('change-difficulty', params),
    changeImportance: (params) => ipcRenderer.send('change-importance', params),
    changeProject: (params) => ipcRenderer.send('change-project', params),

    askWeekGoals: (params) => ipcRenderer.send('ask-week-goals', params),
    getWeekGoals: (func) => ipcRenderer.on('get-week-goals', (event, goals) => func(goals)),
    changeDate: (params) => ipcRenderer.send('change-date', params),
    askGoalInfo: (params) => ipcRenderer.send('ask-goal-info', params),
    getEditInfo: (func) => ipcRenderer.on('get-edit-info', (event, goal, steps) => func(goal, steps)),

    setDefaultEdit: (params) => ipcRenderer.send('set-default-edit', params),

    askMonthGoals: (params) => ipcRenderer.send('ask-month-goals', params),
    getMonthGoals: (func) => ipcRenderer.on('get-month-goals', (event, goals_dict) => func(goals_dict)),
    getMonthGoalsDone: (func) => ipcRenderer.on('get-month-goals-done', (event, goals_dict) => func(goals_dict)),

    askProjectsInfo: (params) => ipcRenderer.send('ask-projects-info', params),
    getProjectsInfo: (func) => ipcRenderer.on('get-projects-info', (event, projects) => func(projects)),
    askProjectGoals: (params) => ipcRenderer.send('ask-project-goals', params),
    getProjectGoals: (func) => ipcRenderer.on('get-project-goals', (event, goals, steps) => func(goals, steps)),
    askProjectSidebar: (params) => ipcRenderer.send('ask-project-sidebar', params),
    getProjectSidebar: (func) => ipcRenderer.on('get-project-sidebar', (event, goals, steps) => func(goals, steps)),
    getFromProject: (params) => ipcRenderer.send('get-from-project', params),
    projectToGoal: (func) => ipcRenderer.on('project-to-goal', (event, steps, position) => func(steps, position)),


    goalRemoveDate: (params) => ipcRenderer.send('goal-remove-date', params),
})


contextBridge.exposeInMainWorld('sidebarAPI', {
    askHistory: (params) => ipcRenderer.send('ask-history', params),
    getHistory: (func) => ipcRenderer.on('get-history', (event, data) => func(data)),
    deleteHistory: (params) => ipcRenderer.send('delete-history', params),
    historyToGoal: (func) => ipcRenderer.on('history-to-goal', (event, steps, goal) => func(steps, goal)),
    sideChangeChecks: (params) => ipcRenderer.send('side-check-change', params),
    removingHistory: (callback) => ipcRenderer.on("removing-history", callback),
    historyRemoved: (params) => ipcRenderer.send('history-removed', params),

    askIdeas: (params) => ipcRenderer.send('ask-ideas', params),
    getIdeas: (func) => ipcRenderer.on('get-ideas', (event, data) => func(data)),
    deleteIdea: (params) => ipcRenderer.send('delete-idea', params),
    newIdea: (params) => ipcRenderer.send('new-idea', params),
    removingIdea: (callback) => ipcRenderer.on("removing-idea", callback),
    ideaRemoved: (params) => ipcRenderer.send('idea-removed', params),

    removingProjectGoal: (callback) => ipcRenderer.on("removing-project-goal", callback),
    projectGoalRemoved: (params) => ipcRenderer.send('project-goal-removed', params),
})

contextBridge.exposeInMainWorld('appAPI', {
    contextMenuOpen: (params) => ipcRenderer.send('context-menu-open', params),

    changeWindow: (params) => ipcRenderer.send('change_window', params),
    startPosChange: (params) => ipcRenderer.send('start_pos_change', params),
    stopPosChange: (params) => ipcRenderer.send('stop_pos_change', params),

    showFloatbarMenu: (params) => ipcRenderer.send('show_floatbar_menu', params),
    showGoals: (params) => ipcRenderer.send('show_goals', params),
    returnState: (func) => ipcRenderer.on('return_state', (event, data) => func(data)),
})