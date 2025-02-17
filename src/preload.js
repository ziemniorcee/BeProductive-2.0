// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron')


contextBridge.exposeInMainWorld('goalsAPI', {
    getDayView: (params) => ipcRenderer.invoke('get-day-view', params),
    getWeekView: (params) => ipcRenderer.invoke('get-week-view', params),
    getMonthView: (params) => ipcRenderer.invoke('get-month-view', params),
    getProjectView: (params) => ipcRenderer.invoke('get-project-view', params),

    test: (params) => ipcRenderer.send('test', params),
    newGoal: (params) => ipcRenderer.send('new-goal', params),
    removingGoal: (callback) => ipcRenderer.on("removing-goal", callback),
    removingFollowing: (callback) => ipcRenderer.on("removing-following", callback),
    goalRemoved: (params) => ipcRenderer.send('goal-removed', params),
    followingRemoved: (params) => ipcRenderer.send('following-removed', params),
    getFollowingRemoved: (func) => ipcRenderer.on('get-following-removed', (event, positions) => func(positions)),
    rowsChange: (params) => ipcRenderer.send('rows-change', params),
    changeChecksGoal: (params) => ipcRenderer.send('change-checks-goal', params),

    changeChecksStep: (params) => ipcRenderer.send('change-checks-step', params),

    editGoal: (params) => ipcRenderer.send('edit-goal', params),

    askWeekGoals: (params) => ipcRenderer.send('ask-week-goals', params),
    getWeekGoals: (func) => ipcRenderer.on('get-week-goals', (event, goals) => func(goals)),
    changeDate: (params) => ipcRenderer.send('change-date', params),
    askEditGoal: (params) => ipcRenderer.invoke('ask-edit-goal', params),
    getEditGoal: (func) => ipcRenderer.on('get-edit-goal', (event, goal, steps) => func(goal, steps)),
    changeWeekGoalCheck: (params) => ipcRenderer.send('change-week-goal-check', params),

    askMonthGoals: (params) => ipcRenderer.send('ask-month-goals', params),
    getMonthGoals: (func) => ipcRenderer.on('get-month-goals', (event, goals_dict) => func(goals_dict)),
    getMonthGoalsDone: (func) => ipcRenderer.on('get-month-goals-done', (event, goals_dict) => func(goals_dict)),

    goalRemoveDate: (params) => ipcRenderer.send('goal-remove-date', params),

    askProductivity: (params) => ipcRenderer.send('ask-productivity', params),
    getProductivity: (func) => ipcRenderer.on('get-productivity', (event, productivities) => func(productivities)),

    askCategoriesCounts: () => ipcRenderer.send('ask-categories-counts'),
    getCategoriesCounts: (func) => ipcRenderer.on('get-categories-counts', (event, counts) => func(counts)),

    askCategories: () => ipcRenderer.send('ask-categories'),
    // getCategories: (func) => ipcRenderer.on('get-categories', (event, categories) => func(categories)),


    addCategory: (params) => ipcRenderer.send('add-category', params),
    removeCategory: (params) => ipcRenderer.send('remove-category', params),

    // askGalacticConnections: () => ipcRenderer.send('ask-galactic-conn'),
    // getGalacticConnections: (func) => ipcRenderer.on('get-galactic-conn', (event, connections) => func(connections)),

    changeProjectCoords: (params) => ipcRenderer.send('change-projects-coords', params),
    changeGalacticConnections: (params) => ipcRenderer.send('change-galactic-connections', params),

    // askHabits: () => ipcRenderer.send('ask-habits'),
    // getHabits: (func) => ipcRenderer.on('get-habits', (event, habits) => func(habits)),

    // askHabitsDays: () => ipcRenderer.send('ask-habits-days'),
    // getHabitsDays: (func) => ipcRenderer.on('get-habits-days', (event, days) => func(days)),

    // askHabitsLogs: () => ipcRenderer.send('ask-habits-logs'),
    // getHabitsLogs: (func) => ipcRenderer.on('get-habits-logs', (event, days) => func(days)),

})

contextBridge.exposeInMainWorld('projectsAPI', {
    askAllProjects: () => ipcRenderer.send('ask-all-projects'),
    getAllProjects: (func) => ipcRenderer.on('get-all-projects', (event, projects) => func(projects)),

    askProjectGoals: (params) => ipcRenderer.send('ask-project-goals', params),
    getProjectGoals: (func) => ipcRenderer.on('get-project-goals', (event, goals, steps) => func(goals, steps)),
    askProjectSidebar: (params) => ipcRenderer.invoke('ask-project-sidebar', params),
    getProjectSidebar: (func) => ipcRenderer.on('get-project-sidebar', (event, goals, steps) => func(goals, steps)),
    getFromProject: (params) => ipcRenderer.send('get-from-project', params),
    projectToGoal: (func) => ipcRenderer.on('project-to-goal', (event, steps, position) => func(steps, position)),
    newProject: (params) => ipcRenderer.send('new-project', params),


    deleteProject: (params) => ipcRenderer.send('delete-project', params),
    removeProject: (params) => ipcRenderer.send('remove-project', params),
})

contextBridge.exposeInMainWorld('sidebarAPI', {
    askHistory: (params) => ipcRenderer.invoke('ask-history', params),
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

contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (fileName, fileData) => ipcRenderer.invoke('save-file', fileName, fileData),
    getIcons: () => ipcRenderer.invoke('get-icons'),
});

contextBridge.exposeInMainWorld('dataAPI', {
    getCategories: () => ipcRenderer.invoke('get-categories'),
    getProjects: () => ipcRenderer.invoke('get-projects'),
    getGalacticConnections: () => ipcRenderer.invoke('get-galactic-connections'),
    getHabits: () => ipcRenderer.invoke('get-habits'),
    getHabitsDays: () => ipcRenderer.invoke('get-habits-days'),
    getHabitsLogs: () => ipcRenderer.invoke('get-habits-logs'),
});

contextBridge.exposeInMainWorld('inboxAPI', {
    getInbox: () => ipcRenderer.invoke('get-inbox'),
    newInboxGoal: (params) => ipcRenderer.send('new-inbox-goal', params),
    checkInboxGoal: (params) => ipcRenderer.send('check-inbox-goal', params),
});

