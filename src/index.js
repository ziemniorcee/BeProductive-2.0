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

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow()

    const ctxMenu = new Menu()
    ctxMenu.append(new MenuItem({
        label: 'Remove',
        click: () => {
            mainWindow.webContents.send("removing-goal")
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
    }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

