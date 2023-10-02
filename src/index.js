const electron = require("electron")

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const path = require('path');
const Menu = electron.Menu
const MenuItem = electron.MenuItem
let mainWindow;

const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database("./goals.db")

let id_array = []
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
ipcMain.on('get-data', (event, params) => {
    if(today_date == null){
        today_date = params.date
    }
    current_date = params.date
    console.log(current_date)
    db.all("SELECT id, goal, check_state FROM goals WHERE addDate=" + "'" + current_date + "'" + ";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            id_array = rows.map(({id}) => id)
            event.reply('receive-data', rows)

        }
    })
})

ipcMain.on('send-data', (event, params) => {
    db.run("INSERT INTO goals (goal, addDate) VALUES (" + "'" + params.goal_text + "'" + ", " + "'" + current_date + "'" + ") ")

    db.all("SELECT id FROM goals WHERE addDate=" + "'" + current_date + "'" + ";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            id_array = rows.map(({id}) => id)
        }
    })
})

ipcMain.on('rows-change', (event, params) => {
    db.all("SELECT id FROM goals WHERE addDate=" + "'" + current_date + "'" + ";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            for (let i = 0; i < rows.length; i++) {
                db.run("UPDATE goals SET goal=" + "'" + params.tasks[i] + "'" + ", check_state = " + "'" + params.checks[i] + "'" + " WHERE id=" + rows[i].id + ";")
            }

        }
    })
})

ipcMain.on('removeDiv', (event, params) => {
    db.run("DELETE FROM goals WHERE id=" + id_array[params.tasks.length] + ";")
    for (let i = 0; i < params.tasks.length; i++) {
        db.run("UPDATE goals SET goal=" + "'" + params.tasks[i] + "'" + ", check_state = " + "'" + params.checks[i] + "'" + " WHERE id=" + id_array[i] + ";")
    }
})

ipcMain.on('change_checks', (event, params) => {
    for (let i = 0; i < params.checks.length; i++) {
        db.run("UPDATE goals SET check_state=" + "'" + params.checks[i] + "'" + "WHERE id=" + id_array[i] + ";")
    }
})

ipcMain.on('get-history', (event, params) => {

    let query = "SELECT goal, addDate  FROM goals WHERE addDate IN (SELECT addDate  FROM goals WHERE addDate<" + "'" + today_date + "'" + " and check_state = 0 GROUP BY addDate ORDER BY addDate DESC LIMIT 5) and check_state = 0 ORDER BY  addDate DESC;"
    db.all(query, (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            event.reply('receive-history', rows)

        }
    })
})

ipcMain.on('removeSidebar', (event, params) => {
    db.all("SELECT id FROM goals WHERE addDate=" + "'" + params.date + "' and check_state = 0" + ";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            console.log(rows[0].id)
            db.run("DELETE FROM goals WHERE id=" + rows[params.tasks.length].id + ";")
            for (let i = 0; i < params.tasks.length; i++) {
                console.log("XDXDXD")
                db.run("UPDATE goals SET goal=" + "'" + params.tasks[i] + "'" + " WHERE id=" + rows[i].id + ";")
            }
        }
    })
})

ipcMain.on('side_check_change', (event, params) => {

    db.all("SELECT id FROM goals WHERE addDate=" + "'" + params.date + "' and check_state = 0" + ";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            db.run("UPDATE goals SET check_state=1 WHERE id=" + rows[params.index].id + ";")
        }
    })

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
            mainWindow.webContents.send("selectDiv")
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

