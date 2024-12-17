const electron = require("electron")
const {ipcMain} = require('electron')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path');

const Menu = electron.Menu
const MenuItem = electron.MenuItem


const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database("./goals.db")


const {todoHandlers, appHandlers} = require('./ipcHandlers')
todoHandlers(db)


let mainWindow
let floatMenuWindow
let floatContentWindow
appHandlers(mainWindow, floatMenuWindow, floatContentWindow) // doesnt work

if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        // width: 1920,
        width: 2320,
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

// const createFloatbar = () => {
//
//     floatMenuWindow = new BrowserWindow({
//         show: false,
//         width: 100,
//         height: 100,
//         webPreferences: {
//             preload: path.join(__dirname, './preload.js'),
//             nodeIntegration: true,
//             contextIsolation: true,
//         },
//         titleBarStyle: 'hidden'
//     })
//     let menu_pos = floatMenuWindow.getPosition()
// // floatWindow.webContents.openDevTools();
//
//
//     floatMenuWindow.loadFile(path.join(__dirname, 'floatbar.html'));
//     floatContentWindow = new BrowserWindow({
//         show: false,
//         width: 400,
//         height: 400,
//         webPreferences: {
//             preload: path.join(__dirname, './preload.js'),
//             nodeIntegration: true,
//             contextIsolation: true,
//         },
//         titleBarStyle: 'hidden'
//     })
//     floatContentWindow.setPosition(menu_pos[0] - 400, menu_pos[1])
//     // floatWindow.setAlwaysOnTop(true);
//
//
// }


process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

let context_option = 0

const ctxMenuRepeat = new Menu()
ctxMenuRepeat.append(new MenuItem({
    label: '  Remove  ',
    submenu: [
        {
            label: 'This goal',
            click: () => {
                mainWindow.webContents.send("removing-goal")
            }
        },
        {
            label: 'This and all the following goals',
            click: () => {
                mainWindow.webContents.send("removing-following")
            }
        }
    ]
}))



const ctxMenuNormal = new Menu()
ctxMenuNormal.append(new MenuItem({
    label: '  Remove  ',
    click: () => {
        if (context_option === 0) mainWindow.webContents.send("removing-goal")
        else if (context_option === 1) mainWindow.webContents.send("removing-history")
        else if (context_option === 2) mainWindow.webContents.send("removing-idea")
        else if (context_option === 3) mainWindow.webContents.send("removing-project-goal")
    }
}))


ipcMain.on('context-menu-open', (event, params) => {
    if (params.repeat) ctxMenuRepeat.popup(mainWindow)
    else {
        context_option = params.option
        ctxMenuNormal.popup(mainWindow)
    }
})


app.on('ready', function () {
    createWindow()
    mainWindow.webContents.on('context-menu', function () {
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
        // createWindow();
    }


});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

