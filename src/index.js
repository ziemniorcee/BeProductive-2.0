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

let goal_ids = []
let step_ids = {}
let history_ids = []
let idea_ids = []
let current_goal_pos = 0

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
    current_date = params.date

    db.all(`SELECT id, goal, check_state, goal_pos, category
            FROM goals
            WHERE addDate = "${current_date}"
            ORDER BY goal_pos`, (err, rows) => {
        if (err) console.error(err)
        else {
            let positions = rows.map((goal) => Number(goal.goal_pos))
            if (positions.length > 0) current_goal_pos = Math.max.apply(Math, positions) + 1
            else current_goal_pos = 0

            goal_ids = rows.map((goal) => goal.id)
            let ids_string = `( ${goal_ids} )`
            db.all(`SELECT id, goal_id, step_text, step_check
                    FROM steps
                    WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                if (err2) console.error(err2)
                else {
                    for (let i = 0; i < steps.length; i++) {
                        if (steps[i].goal_id in step_ids) step_ids[steps[i].goal_id].push(steps[i].id)
                        else step_ids[steps[i].goal_id] = [steps[i].id]
                    }
                    event.reply('get-goals', rows, steps)
                }
            })
        }
    })
})

ipcMain.on('new-goal', (event, params) => {
    db.run(`INSERT INTO goals (goal, addDate, goal_pos, category)
            VALUES ("${params.goal_text}", "${current_date}", ${current_goal_pos}, ${params.category})`)
    db.all(`SELECT id
            FROM goals
            WHERE id = (SELECT max(id) FROM goals)`, (err, rows) => {
        goal_ids.push(rows[0].id)
        for (let i = 0; i < params.steps.length; i++) {
            db.run(`INSERT INTO steps (step_text, goal_id)
                    VALUES ("${params.steps[i]}", ${rows[0].id})`)
        }
        db.all(`SELECT id
                FROM steps
                WHERE goal_id = ${rows[0].id}`, (err, rows2) => {
            if (rows2.length > 0) step_ids[rows[0].id] = [rows2[0].id]
            else step_ids[rows[0].id] = []
            for (let i = 1; i < rows2.length; i++) {
                step_ids[rows[0].id].push(rows2[i].id)
            }
        })
    })
    current_goal_pos++
})

ipcMain.on('rows-change', (event, params) => {
    for (let i = 0; i < goal_ids.length; i++) {
        db.run(`UPDATE goals
                SET goal_pos=${i + 1}
                WHERE id = ${goal_ids[params.after[i]]}`)
    }
})

ipcMain.on('goal-removed', (event, params) => {
    db.run(`DELETE
            FROM goals
            WHERE id = ${goal_ids[params.id]}`)
    db.run(`DELETE
            FROM steps
            WHERE goal_id = ${goal_ids[params.id]}`)

    delete step_ids[goal_ids[params.id]]
    goal_ids.splice(params.id, 1)
})

ipcMain.on('change-checks-goal', (event, params) => {
    db.run(`UPDATE goals
            SET check_state="${Number(params.state)}"
            WHERE id = ${goal_ids[params.id]}`)
})

ipcMain.on('change-checks-step', (event, params) => {
    db.run(`UPDATE steps
            SET step_check="${params.state}"
            WHERE id = ${step_ids[goal_ids[params.goal_id]][params.step_id]}`)
})

ipcMain.on('change-text-goal', (event, params) => {
    db.run(`UPDATE goals
            SET goal="${params.input}"
            WHERE id = ${goal_ids[params.id]}`)
})

ipcMain.on('add-step', (event, params) => {
    db.run(`INSERT INTO steps (step_text, goal_id)
            VALUES ("${params.input}", ${goal_ids[params.id]})`)

    db.all(`SELECT id
            from steps
            ORDER BY id DESC LIMIT 1`, (err, rows) => {
        if (err) console.error(err)
        else {
            if (!(goal_ids[params.id] in step_ids)) step_ids[goal_ids[params.id]] = [rows[0].id]
            step_ids[goal_ids[params.id]].push(rows[0].id)
        }
    })
})

ipcMain.on('change-step', (event, params) => {
    db.run(`UPDATE steps
            SET step_text="${params.input}"
            WHERE id = ${step_ids[goal_ids[params.goal_id]][params.step_id]}`)
})

ipcMain.on('remove-step', (event, params) => {
    db.run(`DELETE
            FROM steps
            WHERE id = ${step_ids[goal_ids[params.goal_id]][params.step_id]}`)
    step_ids[goal_ids[params.goal_id]].splice(params.step_id, 1)
})

ipcMain.on('ask-history', (event, params) => {
    let query = `SELECT id, goal, addDate
                 FROM goals
                 WHERE addDate IN (SELECT addDate
                                   FROM goals
                                   WHERE addDate < "${params.date}"
                                     and check_state = 0
                                   GROUP BY addDate
                                   ORDER BY addDate DESC
                     LIMIT 10)
                   and check_state = 0
                 ORDER BY addDate DESC;`
    db.all(query, (err, rows) => {
        if (err) console.error(err)
        else {
            history_ids = rows.map((goal) => goal.id)
            event.reply('get-history', rows)
        }
    })
})

ipcMain.on('delete-history', (event, params) => {
    let category = 1
    db.run(`UPDATE goals
            SET addDate="${current_date}", goal_pos=${current_goal_pos}
            WHERE id = ${history_ids[params.id]}`)

    db.all(`SELECT category FROM goals WHERE id = ${history_ids[params.id]}`, (err2, goal) => {
        if (err2) console.error(err2)
        else {
            category = goal[0].category
        }
    })

    db.all(`SELECT id, goal_id, step_text, step_check
            FROM steps
            WHERE goal_id = ${history_ids[params.id]}`, (err2, steps) => {
        if (err2) console.error(err2)
        else {
            for (let i = 0; i < steps.length; i++) {
                if (steps[i].goal_id in step_ids) step_ids[steps[i].goal_id].push(steps[i].id)
                else step_ids[steps[i].goal_id] = [steps[i].id]
            }
        }
        goal_ids.push(history_ids[params.id])
        history_ids.splice(params.id, 1)
        event.reply('history-to-goal', steps)
    })
    current_goal_pos++
})

ipcMain.on('side-check-change', (event, params) => {
    db.run(`UPDATE goals
            SET check_state=1
            WHERE id = ${history_ids[params.id]}`)
    history_ids.splice(params.id, 1)
})

ipcMain.on('history-removed', (event, params) => {
    db.run(`DELETE
            FROM goals
            WHERE id = ${history_ids[params.id]}`)
    history_ids.splice(params.id, 1)
})

ipcMain.on('ask-ideas', (event) => {
    db.all("SELECT id ,idea FROM ideas ORDER BY id DESC LIMIT 50;", (err, rows) => {
        if (err) console.error(err)
        else {
            idea_ids = rows.map((idea) => idea.id)
            event.reply('get-ideas', rows)
        }
    })
})

ipcMain.on('delete-idea', (event, params) => {
    db.run(`DELETE
            FROM ideas
            where id = ${idea_ids[params.id]}`)
    idea_ids.splice(params.id, 1)

    db.run(`INSERT INTO goals (goal, addDate, goal_pos)
            VALUES ("${params.goal_text}", "${current_date}", ${current_goal_pos})`)

    db.all(`SELECT id
            from goals
            ORDER BY id DESC LIMIT 1`, (err, rows) => {
        if (err) console.error(err)
        else {
            goal_ids.push(rows[0].id)
            step_ids[rows[0].id] = []
        }
    })

})


ipcMain.on('new-idea', (event, params) => {
    db.run("INSERT INTO ideas (idea) VALUES(" + "'" + params.text + "');")

    db.all("SELECT id  FROM ideas ORDER BY id DESC LIMIT 1;", (err, rows) => {
        if (err) console.error(err)
        else idea_ids.unshift(rows[0].id)
    })
})

ipcMain.on('idea-removed', (event, params) => {
    db.run(`DELETE FROM ideas WHERE id=${idea_ids[params.id]}`)
    idea_ids.splice(params.id, 1)
})

ipcMain.on('change_window', () => {
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


ipcMain.on('start_pos_change', () => {
    move_flag = true
    let pos_before = floatMenuWindow.getPosition()
    let mouse_pos = electron.screen.getCursorScreenPoint()
    middle = [mouse_pos.x - pos_before[0], mouse_pos.y - pos_before[1]]
    floatbar_refresh()
})
ipcMain.on('stop_pos_change', () => {
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

ipcMain.on('show_floatbar_menu', () => {
    menu_state = !menu_state
    floatMenuWindow.setSize(100, menu_sizes[Number(menu_state)])
    if (menu_state === false) {
        floatContentWindow.hide()
        goals_state = false
    }
})


ipcMain.on('show_goals', (event) => {
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
    mainWindow.webContents.on('context-menu', function () {
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

