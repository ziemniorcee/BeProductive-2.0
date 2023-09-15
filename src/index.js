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
ipcMain.on('get-data', (event,params) => {
    console.log(params)
    db.all("SELECT goal FROM goals WHERE addDate="+"'"+params.date+"'"+";", (err, rows) => { // This queries the database
        if (err) {
            console.error(err)
        } else {
            event.reply('receive-data', rows) // This sends the data to the renderer process
        }
    })
})

ipcMain.on('send-data', (event,params) =>{

    console.log(params)
    db.run("INSERT INTO goals (goal, addDate) VALUES ("+"'"+params.goal_text+"'"+", "+"'"+params.date+"'"+") ")
})
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
    createWindow()

    const template = [
        {
            label: 'demo'
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    // Menu.setApplicationMenu(menu)

    const ctxMenu = new Menu()
    ctxMenu.append(new MenuItem({
        label: 'Remove',
        click: function (){

            console.log('menu item clicked')
        }
    }))
    mainWindow.webContents.on('context-menu', function (e, params){
        ctxMenu.popup(mainWindow, params.x, params.y)
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

