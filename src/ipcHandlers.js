const {ipcMain} = require('electron')
const electron = require("electron");

module.exports = {todoHandlers, appHandlers}

function todoHandlers(db) {
    let current_date = null
    let goal_ids = []
    let step_ids = {}
    let history_ids = []
    let idea_ids = []
    let current_goal_pos = 0

    ipcMain.on('ask-goals', (event, params) => {
        step_ids = {}
        current_date = params.date

        db.all(`SELECT id, goal, check_state, goal_pos, category, difficulty, importance
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

    ipcMain.on('ask-week-goals', (event, params) => {
        const weekdays = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];

        db.all(`SELECT id, goal, addDate, check_state, goal_pos, category, difficulty, importance
                FROM goals
                WHERE addDate between "${params.dates[0]}" and "${params.dates[6]}" and check_state=0
                ORDER BY addDate, goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                goal_ids = []

                for(let i = 0; i < 4; i++){
                    for(let j = 0; j < weekdays[i].length; j++){
                        let filtred = goals.filter(record => record.addDate === params.dates[i + j * 3])
                        let ids = filtred.map(record => record.id)
                        goal_ids.push(...ids)
                    }
                }
                event.reply('get-week-goals', goals)
            }
        })
    })


    ipcMain.on('ask-month-goals', (event, params) => {
        db.all(`SELECT id, goal, addDate, check_state, goal_pos, category, difficulty, importance
                FROM goals
                WHERE addDate between "${params.dates[0]}" and "${params.dates[1]}" and check_state=0
                ORDER BY addDate, goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                goal_ids = goals.map((goal) => goal.id)
                let goals_dict = {}
                for (let i = 0; i < goals.length; i++){
                    let day = Number(goals[i].addDate.slice(-2))

                    if (day in goals_dict) goals_dict[day].push([goals[i].goal, goals[i].category])
                    else goals_dict[day] = [[goals[i].goal, goals[i].category]]
                }

                event.reply('get-month-goals', goals_dict)
            }
        })
    })


    ipcMain.on('change-date', (event, params) => {
        db.run(`UPDATE goals
            SET addDate="${params.date}"
            WHERE id = ${goal_ids[params.id]}`)

        for (let i = 0; i < params.order.length; i++) {
            db.run(`UPDATE goals
                    SET goal_pos=${i + 1}
                    WHERE id = ${goal_ids[params.order[i]]}`)
        }
    })

    ipcMain.on('ask-steps', (event, params) => {
        db.all(`SELECT id, goal_id, step_text, step_check
                        FROM steps
                        WHERE goal_id =${goal_ids[params.todo_id]}`, (err2, steps) => {
            if (err2) console.error(err2)
            else {
                step_ids = {}
                step_ids[goal_ids[params.todo_id]] = steps.map((step) => step.id)
                event.reply('get-steps', steps)
            }
        })
    })


    ipcMain.on('new-goal', (event, params) => {
        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category, difficulty, importance)
                VALUES ("${params.goal_text}", "${current_date}", ${current_goal_pos}, ${params.category},
                        ${params.difficulty}, ${params.importance})`)
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
            WHERE id = ${step_ids[goal_ids[params.id]][params.step_id]}`)
    })

    ipcMain.on('remove-step', (event, params) => {
        db.run(`DELETE
            FROM steps
            WHERE id = ${step_ids[goal_ids[params.id]][params.step_id]}`)
        step_ids[goal_ids[params.id]].splice(params.step_id, 1)
    })

    ipcMain.on('change-category', (event, params) => {
        db.run(`UPDATE goals
            SET category="${params.new_category}"
            WHERE id = ${goal_ids[params.id]}`)
    })

    ipcMain.on('change-difficulty', (event, params) => {
        db.run(`UPDATE goals
            SET Difficulty="${params.difficulty}"
            WHERE id = ${goal_ids[params.id]}`)
    })

    ipcMain.on('change-importance', (event, params) => {
        db.run(`UPDATE goals
            SET Importance="${params.importance}"
            WHERE id = ${goal_ids[params.id]}`)
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
        let parameters = ["test", 1, 2, 2]

        db.run(`UPDATE goals
            SET addDate="${current_date}", goal_pos=${current_goal_pos}
            WHERE id = ${history_ids[params.id]}`)

        db.all(`SELECT goal ,category, Difficulty, Importance FROM goals WHERE id = ${history_ids[params.id]}`, (err2, goal) => {
            if (err2) console.error(err2)
            else {
                parameters[0] = goal[0].goal
                parameters[1] = goal[0].category
                parameters[2] = goal[0].Importance
                parameters[3] = goal[0].Difficulty
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
            event.reply('history-to-goal', steps, parameters)
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

        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category)
            VALUES ("${params.goal_text}", "${current_date}", ${current_goal_pos}, 1)`)

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
}

function appHandlers(mainWindow, floatMenuWindow, floatContentWindow ){ //doesnt work
    let mainWindow_state = true
    let move_flag = false
    let middle = []

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
}