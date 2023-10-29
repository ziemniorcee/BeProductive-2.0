const electron = require("electron")

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const path = require('path');
const Menu = electron.Menu
const MenuItem = electron.MenuItem


const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database("./goals.db")

let current_date = null
let today_date = null

let mainWindow
let floatMenuWindow
let floatContentWindow

let mainWindow_state = true
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 1920,
        height: 1080,

        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();


};

const createFloatbar = () => {

    floatMenuWindow = new BrowserWindow({
        show: false,
        width: 100,
        height: 100,
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden'
    })
    let menu_pos = floatMenuWindow.getPosition()
// floatWindow.webContents.openDevTools();


    floatMenuWindow.loadFile(path.join(__dirname, 'floatbar.html'));
    floatContentWindow = new BrowserWindow({
        show: false,
        width: 400,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden'
    })
    floatContentWindow.setPosition(menu_pos[0] - 400, menu_pos[1])
    // floatWindow.setAlwaysOnTop(true);


}

ipcMain.on('ask-goals', (event, params) => {
    if (today_date == null) today_date = params.date
    current_date = params.date
    db.all("SELECT id, goal, check_state FROM goals WHERE addDate=" + "'" + current_date + "'" + ";", (err, rows) => { // This queries the database
        if (err) console.error(err)
        else event.reply('get-goals', rows)
    })
})

ipcMain.on('new-goal', (event, params) => {
    db.run("INSERT INTO goals (goal, addDate) VALUES (" + "'" + params.goal_text + "'" + ", " + "'" + current_date + "'" + ") ")
})

ipcMain.on('rows-change', (event, params) => {
    db.all("SELECT id FROM goals WHERE addDate=" + "'" + current_date + "'" + ";", (err, rows) => { // This queries the database
        if (err) console.error(err)
        else {
            for (let i = 0; i < rows.length; i++) {
                db.run("UPDATE goals SET goal=" + "'" + params.tasks[i] + "'" + ", check_state = " + "'" + params.checks[i] + "'" + " WHERE id=" + rows[i].id + ";")
            }
        }
    })
})

ipcMain.on('goal-removed', (event, params) => {
    db.run("DELETE FROM goals WHERE id IN (SELECT id FROM goals WHERE addDate=" + "'" + current_date + "'" + " LIMIT 1 OFFSET " + params.id + ");")
})

ipcMain.on('change-checks', (event, params) => {
    db.run("UPDATE goals SET check_state=" + params.state + " WHERE id IN(SELECT id FROM goals where addDate=" + "'" + current_date + "'" + " LIMIT 1 OFFSET " + params.id + ");")
})

ipcMain.on('ask-history', (event) => {
    let query = "SELECT goal, addDate  FROM goals WHERE addDate IN (SELECT addDate  FROM goals WHERE addDate<" + "'" + today_date + "'" + " and check_state = 0 GROUP BY addDate ORDER BY addDate DESC LIMIT 10) and check_state = 0 ORDER BY  addDate DESC;"
    db.all(query, (err, rows) => {
        if (err) console.error(err)
        else event.reply('get-history', rows)
    })
})

ipcMain.on('delete-history', (event, params) => {
    db.run("DELETE FROM goals WHERE id IN(SELECT id  FROM goals WHERE addDate IN (SELECT addDate  FROM goals WHERE addDate<" + "'" + today_date + "'" + " and check_state = 0 GROUP BY addDate ORDER BY addDate DESC LIMIT 10) and check_state = 0 ORDER BY  addDate DESC LIMIT 1 OFFSET " + params.id + ");")
})

ipcMain.on('side-check-change', (event, params) => {
    db.run("UPDATE goals SET check_state=1 WHERE id IN(SELECT id  FROM goals WHERE addDate IN (SELECT addDate  FROM goals WHERE addDate<" + "'" + today_date + "'" + " and check_state = 0 GROUP BY addDate ORDER BY addDate DESC LIMIT 10) and check_state = 0 ORDER BY  addDate DESC LIMIT 1 OFFSET " + params.id + ");")
})

ipcMain.on('history-removed', (event, params) => {
    db.run("DELETE FROM goals WHERE id IN(SELECT id  FROM goals WHERE addDate IN (SELECT addDate  FROM goals WHERE addDate<" + "'" + today_date + "'" + " and check_state = 0 GROUP BY addDate ORDER BY addDate DESC LIMIT 10) and check_state = 0 ORDER BY  addDate DESC LIMIT 1 OFFSET " + params.id + ");")
})

ipcMain.on('ask-ideas', (event) => {
    db.all("SELECT idea FROM ideas ORDER BY id DESC LIMIT 50;", (err, rows) => {
        if (err) console.error(err)
        else event.reply('get-ideas', rows)
    })
})

ipcMain.on('delete-ideas', (event, params) => {
    db.run("DELETE FROM ideas where id IN (SELECT id FROM ideas LIMIT 1 OFFSET " + params.id + ");")
})


ipcMain.on('new-idea', (event, params) => {
    db.run("INSERT INTO ideas (idea) VALUES(" + "'" + params.text + "');")
})

ipcMain.on('idea-removed', (event, params) => {
    db.run("DELETE FROM ideas WHERE id IN (SELECT id FROM ideas ORDER BY id DESC LIMIT 1 OFFSET "+params.id+")")
})

ipcMain.on('change_window', (event, params) => {
    mainWindow_state = !mainWindow_state
    if (mainWindow_state) {
        mainWindow.show()
        floatMenuWindow.hide()

    } else {
        floatMenuWindow.show()
        mainWindow.hide()
    }
})

let move_flag = false
let middle = []


ipcMain.on('start_pos_change', (event, params) => {
    move_flag = true
    let pos_before = floatMenuWindow.getPosition()
    let mouse_pos = electron.screen.getCursorScreenPoint()
    middle = [mouse_pos.x - pos_before[0], mouse_pos.y - pos_before[1]]
    floatbar_refresh()
})
ipcMain.on('stop_pos_change', (event, params) => {
    move_flag = false
})

function floatbar_refresh() {
    let mouse_pos = electron.screen.getCursorScreenPoint()
    let new_pos = [mouse_pos.x - middle[0], mouse_pos.y - middle[1]]
    floatMenuWindow.setPosition(new_pos[0], new_pos[1])
    floatContentWindow.setPosition(new_pos[0] - 400, new_pos[1])
    if (move_flag) {
        setTimeout(floatbar_refresh, 7)
    }
}

let menu_state = false
let menu_sizes = [100, 200]

let goals_state = false

ipcMain.on('show_floatbar_menu', (event, params) => {
    menu_state = !menu_state
    floatMenuWindow.setSize(100, menu_sizes[Number(menu_state)])
    if (menu_state === false) {
        floatContentWindow.hide()
        goals_state = false
    }
})


ipcMain.on('show_goals', (event, params) => {
    goals_state = !goals_state
    if (goals_state) floatContentWindow.show()
    else floatContentWindow.hide()
    event.reply('return_state', goals_state)
})

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow()
    createFloatbar()

    const ctxMenu = new Menu()
    ctxMenu.append(new MenuItem({
        label: 'Remove',
        click: () => {
            mainWindow.webContents.send("removing-goal")
            mainWindow.webContents.send("removing-history")
            mainWindow.webContents.send("removing-idea")
        }
    }))
    mainWindow.webContents.on('context-menu', function (e, params) {
        ctxMenu.popup(mainWindow)
    })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        createFloatbar()
    }


});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

