const {ipcMain, ipcRenderer} = require('electron')
const electron = require("electron");

module.exports = {todoHandlers, appHandlers}

function todoHandlers(db) {
    let goal_ids = []
    let step_ids = {}
    let history_ids = []
    let idea_ids = []
    let project_ids = []
    let project_sidebar_ids = []
    let current_goal_pos = 0

    let ids_array = []


    ipcMain.on('ask-goals', (event, params) => {
        db.all(`SELECT G.id,
                       G.goal,
                       G.check_state,
                       G.goal_pos,
                       G.category,
                       G.difficulty,
                       G.importance,
                       PR.category as pr_category,
                       PR.id       as pr_id,
                       PR.icon     as pr_icon,
                       KN.knot_id
                FROM goals G
                         LEFT JOIN knots KN ON KN.goal_id = G.id
                         LEFT JOIN projects PR ON PR.id = G.project_id
                WHERE addDate = "${params.date}"
                ORDER BY goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                set_goal_ids(goals)
                ids_array = goal_ids
                let ids_string = `( ${goal_ids} )`
                db.all(`SELECT id, goal_id, step_text, step_check
                        FROM steps
                        WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                    if (err2) console.error(err2)
                    else {
                        let safe_goals = get_safe_goals(goals, steps)
                        set_step_ids(steps)

                        event.reply('get-goals', safe_goals)
                    }
                })
            }
        })
    })


    ipcMain.on('ask-project-goals', (event, params) => {
        db.all(`SELECT G.id,
                       G.goal,
                       G.check_state,
                       G.goal_pos,
                       G.category,
                       G.difficulty,
                       G.importance,
                       G.addDate
                FROM goals G
                WHERE G.project_id = ${project_ids[params.project_pos]}
                ORDER BY goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                set_goal_ids(goals)
                let ids_string = `( ${goal_ids} )`

                db.all(`SELECT id, goal_id, step_text, step_check
                        FROM steps
                        WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                    if (err2) console.error(err2)
                    else {
                        set_step_ids(steps)
                        let safe_goals = get_safe_goals(goals, steps)

                        event.reply('get-project-goals', safe_goals)
                    }
                })
            }
        })
    })

    ipcMain.on('ask-project-sidebar', (event, params) => {
        console.log(params)
        let option_sql = where_option(params.option, params.project_pos)
        console.log(params.current_dates)

        const current_dates_str = params.current_dates.map(date => `'${date}'`).join(', ');

        db.all(`SELECT G.id,
                       G.goal,
                       G.check_state,
                       G.goal_pos,
                       G.category,
                       G.difficulty,
                       G.importance,
                       G.addDate,
                       CASE WHEN G.addDate IN (${current_dates_str}) THEN 1 ELSE 0 END as "already"
                FROM goals G
                    ${option_sql}
                ORDER BY goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                project_sidebar_ids = goals.map((goal) => goal.id)
                let safe_goals = get_safe_goals(goals, [])
                event.reply('get-project-sidebar', safe_goals)
            }
        })
    })

    function where_option(option, project_pos){
        if (option === 0) {
            return `WHERE G.project_id = ${project_ids[project_pos]} 
                        AND G.check_state = 1`
        } else if (option === 1) {
            return `WHERE G.project_id = ${project_ids[project_pos]} 
                        AND G.check_state = 0 AND G.addDate <> ""`
        } else {
            return `WHERE G.project_id = ${project_ids[project_pos]} 
                        AND G.check_state = 0 AND G.addDate = ""`
        }
    }

    function set_goal_ids(goals) {
        goal_ids = goals.map((goal) => goal.id)
    }

    function set_step_ids(steps) {
        step_ids = {}
        for (let i = 0; i < steps.length; i++) {
            if (steps[i].goal_id in step_ids) step_ids[steps[i].goal_id].push(steps[i].id)
            else step_ids[steps[i].goal_id] = [steps[i].id]
        }
    }

    function get_safe_goals(goals, steps) {
        goals = goals.map(goal => ({...goal, steps: []}))
        let positions = goals.map((goal) => Number(goal.goal_pos))
        if (positions.length > 0) current_goal_pos = Math.max.apply(Math, positions) + 1
        else current_goal_pos = 0

        let safe_steps = steps.map(step => {
            let {id, goal_id, ...rest} = step;
            return rest;
        })
        for (let i = 0; i < steps.length; i++) {
            let goal_index = goal_ids.indexOf(steps[i].goal_id)
            goals[goal_index].steps.push(safe_steps[i])
        }

        let safe_goals = goals.map(goal => {
            let {id, pr_id, goal_pos, ...rest} = goal;
            return rest;
        })
        for (let i = 0; i < goals.length; i++) {
            safe_goals[i]["pr_pos"] = project_ids.indexOf(goals[i].pr_id)
        }

        return safe_goals
    }


    ipcMain.on('ask-week-goals', (event, params) => {
        const weekdays = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];

        db.all(`SELECT G.id,
                       G.goal,
                       G.addDate,
                       G.check_state,
                       G.goal_pos,
                       G.category,
                       G.difficulty,
                       G.importance,
                       KN.knot_id
                FROM goals G
                         LEFT JOIN knots KN ON KN.goal_id = G.id
                WHERE addDate between "${params.dates[0]}" and "${params.dates[6]}"
                  and check_state = 0
                ORDER BY addDate, goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                goal_ids = []

                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < weekdays[i].length; j++) {
                        let filtred = goals.filter(record => record.addDate === params.dates[i + j * 3])
                        let ids = filtred.map(record => record.id)
                        goal_ids.push(...ids)
                    }
                }

                let safe_goals = goals.map(goal => {
                    let {id, ...rest} = goal;
                    return rest;
                })
                event.reply('get-week-goals', safe_goals)
            }
        })
    })


    ipcMain.on('ask-month-goals', (event, params) => {
        db.all(`SELECT G.id, G.goal, G.addDate, G.category, G.difficulty, KN.knot_id
                FROM goals G
                         LEFT JOIN knots KN ON KN.goal_id = G.id
                WHERE addDate between "${params.dates[0]}" and "${params.dates[1]}"
                  and check_state = 0
                ORDER BY addDate, goal_pos`, (err, goals) => {
            if (err) console.error(err)
            else {
                goal_ids = goals.map((goal) => goal.id)
                let goals_dict = {}
                for (let i = 0; i < goals.length; i++) {
                    let day = Number(goals[i].addDate.slice(-2))

                    if (day in goals_dict) goals_dict[day].push({
                        "goal": goals[i].goal,
                        "category": goals[i].category,
                        "knot_id": goals[i].knot_id,
                        "difficulty": goals[i].Difficulty
                    })
                    else goals_dict[day] = [{
                        "goal": goals[i].goal,
                        "category": goals[i].category,
                        "knot_id": goals[i].knot_id,
                        "difficulty": goals[i].Difficulty
                    }]
                }

                if (params.goal_check) event.reply('get-month-goals-done', goals_dict)
                else event.reply('get-month-goals', goals_dict)

            }
        })
    })

    ipcMain.on('ask-projects-info', (event, params) => {
        db.all(`SELECT *
                FROM projects`, (err, projects) => {
            project_ids = projects.map((project) => project.id)
            let safe_projects = projects.map(project => {
                let {id, ...rest} = project;
                return rest;
            })
            event.reply('get-projects-info', safe_projects)
        })

    })

    ipcMain.on('get-from-project', (event, params) => {
        db.run(`UPDATE goals
                SET addDate="${params.date}"
                WHERE id = ${project_sidebar_ids[params.sidebar_pos]}`)

        db.all(`SELECT id, goal_id, step_text, step_check
                FROM steps
                WHERE goal_id = ${project_sidebar_ids[params.sidebar_pos]}`, (err2, steps) => {
            if (err2) console.error(err2)
            else {
                for (let i = 0; i < steps.length; i++) {
                    if (steps[i].goal_id in step_ids) step_ids[steps[i].goal_id].push(steps[i].id)
                    else step_ids[steps[i].goal_id] = [steps[i].id]
                }
                goal_ids.push(project_sidebar_ids[params.sidebar_pos])
                project_sidebar_ids.splice(params.sidebar_pos, 1)

                let safe_steps = steps.map(step => {
                    let {id, goal_id, ...rest} = step;
                    return rest;
                })
                event.reply('project-to-goal', safe_steps, params.main_pos)
            }
        })
    })

    ipcMain.on('new-project', (event, params) => {
        db.run(`INSERT INTO projects (name, category, icon)
                VALUES ("${params.name}", ${params.category}, "${params.icon}")`)

        db.all(`SELECT *
                FROM projects`, (err, projects) => {
            project_ids = projects.map((project) => project.id)
            let safe_projects = projects.map(project => {
                let {id, ...rest} = project;
                return rest;
            })
            event.reply('get-projects-info', safe_projects)
        })
    })

    ipcMain.on('delete-project', (event, params) => {
        db.run(`DELETE
                FROM projects
                WHERE id = ${project_ids[params.position]}`)

        project_ids.splice(params.position, 1)
    })

    ipcMain.on('goal-remove-date', (event, params) => {
        let empty = ""
        let array_ids = goal_ids
        if (params.option === 1){
            array_ids = project_sidebar_ids
        }

        db.run(`UPDATE goals
                SET addDate="${empty}", check_state=0 
                WHERE id = ${array_ids[params.id]}`)

        if (params.option === 1){
            project_sidebar_ids.splice(params.id, 1)
        }

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


    ipcMain.on('ask-goal-info', (event, params) => {
        if (params.option === 0) ids_array = goal_ids
        else if (params.option === 1) ids_array = history_ids
        else if (params.option === 2) ids_array = project_sidebar_ids

        db.all(`SELECT G.goal,
                       G.check_state,
                       G.goal_pos,
                       G.category,
                       G.difficulty,
                       G.importance,
                       PR.id as pr_id
                FROM goals G
                         LEFT JOIN projects PR ON PR.id = G.project_id
                WHERE G.id = ${ids_array[params.todo_id]}
                ORDER BY G.goal_pos`, (err, goal) => {
            if (err) console.error(err)
            else {
                goal[0]["pr_pos"] = project_ids.indexOf(goal[0].pr_id)
                delete goal[0]["pr_id"]

                db.all(`SELECT id, goal_id, step_text, step_check
                        FROM steps
                        WHERE goal_id = ${ids_array[params.todo_id]}`, (err2, steps) => {
                    if (err2) console.error(err2)
                    else {
                        step_ids[ids_array[params.todo_id]] = steps.map((step) => step.id)

                        let safe_steps = steps.map(step => {
                            let {id, goal_id, ...rest} = step;
                            return rest;
                        })

                        event.reply('get-edit-info', goal[0], safe_steps)
                    }
                })
            }
        })
    })


    ipcMain.on('set-default-edit', (event, params) => {
        ids_array = goal_ids
    })

    ipcMain.on('new-goal', (event, params) => {
        let values = ""
        for (let i = 0; i < params.dates.length; i++) {
            let date = params.dates[i]
            let project_id = 0

            if (params.project_pos !== null && params.project_pos !== -1) {
                project_id = project_ids[params.project_pos]
                date = ""
            }

            values += `("${params.goal}", "${date}", ${current_goal_pos}, ${params.category},
                        ${params.difficulty}, ${params.importance}, ${project_id})`
            if (i < params.dates.length - 1) values += ","
            current_goal_pos++
        }
        values += ";"

        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category, difficulty, importance, project_id)
                VALUES ${values}`)

        db.all(`SELECT id
                FROM goals
                WHERE id = (SELECT max(id) FROM goals)`, (err, rows) => {
            let first_id = rows[0].id - params.dates.length + 1
            goal_ids.push(first_id)

            if (params.steps.length) {
                for (let i = 0; i < params.dates.length; i++) {
                    let id = first_id + i
                    let steps_values = ""
                    for (let j = 0; j < params.steps.length; j++) {
                        steps_values += `("${params.steps[j].step_text}", ${id})`
                        if (j < params.steps.length - 1) steps_values += ","
                    }
                    steps_values += ";"
                    db.run(`INSERT INTO steps (step_text, goal_id)
                            VALUES ${steps_values}`)
                }
            }

            db.all(`SELECT id
                    FROM steps
                    WHERE goal_id = ${first_id}`, (err, steps) => {
                if (steps.length > 0) step_ids[first_id] = [steps[0].id]
                else step_ids[first_id] = []
                for (let i = 1; i < steps.length; i++) {
                    step_ids[first_id].push(steps[i].id)
                }
            })

            if (params.dates.length > 1) {
                db.all(`SELECT MAX(knot_id) as maxi
                        FROM knots`, (err, knot) => {
                    if (err) console.error(err)
                    else {
                        let knot_id = knot[0].maxi + 1

                        let knots_values = ""
                        for (let i = 0; i < params.dates.length; i++) {
                            knots_values += `(${knot_id}, ${first_id + i})`
                            if (i < params.dates.length - 1) knots_values += ","
                        }
                        knots_values += ";"

                        db.run(`INSERT INTO knots (knot_id, goal_id)
                                VALUES ${knots_values}`)
                    }
                })
            }
        })
    })

    ipcMain.on('rows-change', (event, params) => {
        for (let i = 0; i < goal_ids.length; i++) {
            db.run(`UPDATE goals
                    SET goal_pos=${i + 1}
                    WHERE id = ${goal_ids[(params.after[i])]}`)
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

    ipcMain.on('following-removed', (event, params) => {
        db.all(`SELECT id
                FROM goals
                WHERE id IN (SELECT goal_id
                             FROM knots
                             WHERE knot_id = (SELECT knot_id FROM knots WHERE goal_id = ${goal_ids[params.id]}))
                  AND addDate >= '${params.date}'`, (err, goals) => {
            if (err) console.error(err)
            else {
                let goals_repeat = []
                let goals_format = "("

                for (let i = 0; i < goals.length; i++) {
                    goals_repeat.push(goals[i].id)
                    goals_format += goals[i].id
                    if (i < goals.length - 1) goals_format += ", "
                    else goals_format += ")"
                }

                db.run(`DELETE
                        FROM steps
                        WHERE goal_id IN ${goals_format}`)
                db.run(`DELETE
                        FROM goals
                        WHERE id IN ${goals_format}`)
                db.run(`DELETE
                        FROM knots
                        WHERE goal_id IN ${goals_format}`)

                let goals_positions = []
                for (let i = 0; i < goal_ids.length; i++) {
                    if (goals_repeat.includes(goal_ids[i])) {
                        goals_positions.push(i)
                    }
                }

                event.reply('get-following-removed', goals_positions)

                for (let i = goals_positions.length - 1; i >= 0; i--) {
                    delete step_ids[goal_ids[goals_positions[i]]]
                    goal_ids.splice(goals_positions[i], 1)
                }
            }
        })
    })

    ipcMain.on('change-checks-goal', (event, params) => {

        let array_ids = goal_ids
        if (params.option === 1){
            array_ids = project_sidebar_ids
        }

        db.run(`UPDATE goals
                SET check_state="${Number(params.state)}"
                WHERE id = ${array_ids[params.id]}`)

        if (params.option === 1){
            project_sidebar_ids.splice(params.id, 1)
        }
    })

    ipcMain.on('change-checks-step', (event, params) => {
        console.log(step_ids)
        console.log(ids_array)
        console.log(params)
        db.run(`UPDATE steps
                SET step_check="${params.state}"
                WHERE id = ${step_ids[ids_array[params.id]][params.step_id]}`)
    })

    ipcMain.on('change-text-goal', (event, params) => {
        db.run(`UPDATE goals
                SET goal="${params.input}"
                WHERE id = ${ids_array[params.id]}`)
    })

    ipcMain.on('add-step', (event, params) => {
        db.run(`INSERT INTO steps (step_text, goal_id)
                VALUES ("${params.input}", ${ids_array[params.id]})`)

        db.all(`SELECT id
                from steps
                ORDER BY id DESC
                LIMIT 1`, (err, rows) => {
            if (err) console.error(err)
            else {
                if (!(ids_array[params.id] in step_ids)) step_ids[ids_array[params.id]] = [rows[0].id]
                step_ids[ids_array[params.id]].push(rows[0].id)
            }
        })
    })

    ipcMain.on('change-step', (event, params) => {
        db.run(`UPDATE steps
                SET step_text="${params.input}"
                WHERE id = ${step_ids[ids_array[params.id]][params.step_id]}`)
    })

    ipcMain.on('remove-step', (event, params) => {
        db.run(`DELETE
                FROM steps
                WHERE id = ${step_ids[ids_array[params.id]][params.step_id]}`)
        step_ids[ids_array[params.id]].splice(params.step_id, 1)
    })

    ipcMain.on('change-category', (event, params) => {
        db.run(`UPDATE goals
                SET category="${params.new_category}"
                WHERE id = ${ids_array[params.id]}`)
    })

    ipcMain.on('change-difficulty', (event, params) => {
        db.run(`UPDATE goals
                SET Difficulty="${params.difficulty}"
                WHERE id = ${ids_array[params.id]}`)
    })

    ipcMain.on('change-importance', (event, params) => {
        db.run(`UPDATE goals
                SET Importance="${params.importance}"
                WHERE id = ${ids_array[params.id]}`)
    })

    ipcMain.on('change-project', (event, params) => {
        let new_project_id = 0
        if (params.project_pos !== -1) new_project_id = project_ids[params.project_pos]
        db.run(`UPDATE goals
                SET project_id="${new_project_id}"
                WHERE id = ${ids_array[params.id]}`)
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
                let safe_rows = rows.map(row => {
                    let {id, ...rest} = row;
                    return rest;
                })
                event.reply('get-history', safe_rows)
            }
        })
    })

    ipcMain.on('delete-history', (event, params) => {
        db.run(`UPDATE goals
                SET addDate="${params.date}",
                    goal_pos=${current_goal_pos}
                WHERE id = ${history_ids[params.id]}`)

        db.all(`SELECT G.goal,
                       G.category,
                       G.difficulty,
                       G.importance,
                       KN.knot_id,
                       PR.category as pr_category,
                       PR.id       as pr_id,
                       PR.icon     as pr_icon
                FROM goals G
                         LEFT JOIN knots KN ON KN.goal_id = G.id
                         LEFT JOIN projects PR ON PR.id = G.project_id
                WHERE G.id = ${history_ids[params.id]}`, (err2, goal) => {
            if (err2) console.error(err2)
            else {
                goal[0]["pr_pos"] = project_ids.indexOf(goal[0].pr_id)
                delete goal[0]["pr_id"]

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

                    let safe_steps = steps.map(step => {
                        let {id, goal_id, ...rest} = step;
                        return rest;
                    })

                    event.reply('history-to-goal', safe_steps, goal[0])
                })
                current_goal_pos++
            }
        })


    })

    ipcMain.on('side-check-change', (event, params) => {
        let local_ids_array =  history_ids
        if (params.option === 2) local_ids_array = project_sidebar_ids
        db.run(`UPDATE goals
                SET check_state=${params.state}
                WHERE id = ${local_ids_array[params.id]}`)
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

                let safe_ideas = rows.map(row => {
                    let {id, goal_id, ...rest} = row;
                    return rest;
                })

                event.reply('get-ideas', safe_ideas)
            }
        })
    })

    ipcMain.on('delete-idea', (event, params) => {
        db.run(`DELETE
                FROM ideas
                where id = ${idea_ids[params.id]}`)
        idea_ids.splice(params.id, 1)

        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category)
                VALUES ("${params.goal_text}", "${params.date}", ${current_goal_pos}, 1)`)

        db.all(`SELECT id
                from goals
                ORDER BY id DESC
                LIMIT 1`, (err, rows) => {
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
        db.run(`DELETE
                FROM ideas
                WHERE id = ${idea_ids[params.id]}`)
        idea_ids.splice(params.id, 1)
    })

    ipcMain.on('project-goal-removed', (event, params) => {
        db.run(`DELETE
                FROM goals
                WHERE id = ${project_sidebar_ids[params.id]}`)
        project_sidebar_ids.splice(params.id, 1)
    })
}

function appHandlers(mainWindow, floatMenuWindow, floatContentWindow) { //doesnt work
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