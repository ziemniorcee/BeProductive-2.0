const {ipcMain, ipcRenderer, dialog} = require('electron')
const electron = require("electron");
const app = electron.app
const path = require('path');
const fsa = require('fs')

module.exports = {todoHandlers, appHandlers}

function todoHandlers(db) {
    let step_ids = {}
    let history_ids = []
    let idea_ids = []
    let project_ids = []
    let project_sidebar_ids = []
    let current_goal_pos = 0

    let ids_array = []
    let ids_array_previous = []


    ipcMain.handle('get-week-view', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id,
                               G.goal,
                               G.addDate,
                               G.check_state,
                               G.goal_pos,
                               G.category,
                               G.difficulty,
                               G.importance,
                               G.date_type,
                               KN.knot_id
                        FROM goals G
                                 LEFT JOIN knots KN ON KN.goal_id = G.id
                        WHERE addDate between "${params.dates[0]}" and "${params.dates[6]}"
                          and check_state = 0
                        ORDER BY addDate, goal_pos`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        resolve(goals);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });


    ipcMain.handle('get-month-view', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id, G.goal, G.addDate, G.category, G.difficulty, G.date_type, KN.knot_id
                        FROM goals G
                                 LEFT JOIN knots KN ON KN.goal_id = G.id
                        WHERE addDate between "${params.dates[0]}" and "${params.dates[1]}"
                          and check_state = ${params.goal_check}
                        ORDER BY addDate, goal_pos`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let goals_dict = {}
                        for (let i = 0; i < goals.length; i++) {
                            let day = Number(goals[i].addDate.slice(-2))

                            let new_dict = {
                                "goal": goals[i].goal,
                                "category": goals[i].category,
                                "knot_id": goals[i].knot_id,
                                "difficulty": goals[i].difficulty,
                                "id": goals[i].id,
                                "date_type": goals[i].date_type
                            }
                            if (day in goals_dict) goals_dict[day].push(new_dict)
                            else goals_dict[day] = [new_dict]
                        }
                        resolve(goals_dict)
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    })


    ipcMain.handle('get-project-view', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id,
                               G.goal,
                               G.check_state,
                               G.goal_pos,
                               G.category,
                               G.difficulty,
                               G.importance,
                               G.addDate
                        FROM goals G
                        WHERE G.project_id = ${params.project_pos}
                        ORDER BY G.importance DESC`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let row_ids = goals.map((goal) => goal.id)
                        let ids_string = `( ${row_ids} )`

                        db.all(`SELECT id, goal_id, step_text, step_check
                                FROM steps
                                WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                            if (err2) reject(err)
                            else {
                                let safe_goals = get_safe_goals2(goals, steps)
                                resolve(safe_goals)
                            }
                        })
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }

    })

    ipcMain.handle('ask-project-sidebar', async (event, params) => {
        const current_dates_str = params.current_dates.map(date => `'${date}'`).join(', ');

        try {
            return await new Promise((resolve, reject) => {
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
                        WHERE G.project_id = ${params.id}
                          AND G.check_state = 0
                          AND G.addDate = ''
                        ORDER BY goal_pos`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let safe_goals = get_safe_goals2(goals, [])
                        resolve(safe_goals)
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }


    })

    function where_option(option, project_id) {
        if (option === 0) {
            return `WHERE G.project_id = ${project_id} 
                        AND G.check_state = 1`
        } else if (option === 1) {
            return `WHERE G.project_id = ${project_id} 
                        AND G.check_state = 0 AND G.addDate <> ""`
        } else {
            return `WHERE G.project_id = ${project_id} 
                        AND G.check_state = 0 AND G.addDate = ""`
        }
    }


    function get_safe_goals2(goals, steps) {
        goals = goals.map(goal => ({...goal, steps: []}))
        let positions = goals.map((goal) => Number(goal.goal_pos))
        if (positions.length > 0) current_goal_pos = Math.max.apply(Math, positions) + 1
        else current_goal_pos = 0

        let safe_steps = steps.map(step => {
            let {goal_id, ...rest} = step;
            return rest;
        })

        for (let i = 0; i < steps.length; i++) {
            let goal_index = steps[i].goal_id
            let item = goals.find(item => item.id === goal_index);
            item.steps.push(safe_steps[i])
        }

        let safe_goals = goals.map(goal => {
            let {goal_pos, ...rest} = goal;
            return rest;
        })

        return safe_goals
    }

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
                WHERE id = ${params.sidebar_id}`)


        db.all(`SELECT id, goal_id, step_text, step_check
                FROM steps
                WHERE goal_id = ${params.sidebar_id}`, (err2, steps) => {
            if (err2) console.error(err2)
            else {
                event.reply('project-to-goal', steps, params.main_pos)
            }
        })
    })

    ipcMain.handle('new-project', async (event, params) => {
        db.run(`INSERT INTO projects (name, category, icon)
                VALUES ("${params.name}", ${params.category}, "${params.icon}")`)


        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM projects
                        ORDER BY id DESC
                        LIMIT 1;`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows[0])
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    })

    ipcMain.on('delete-project', (event, params) => {
        db.run(`DELETE
                FROM projects
                WHERE id = ${params.id}`)

    })

    ipcMain.on('goal-remove-date', (event, params) => {
        let empty = ""
        db.run(`UPDATE goals
                SET addDate="${empty}",
                    check_state=0
                WHERE id = ${params.id}`)
    })


    ipcMain.on('change-date', (event, params) => {
        db.run(`UPDATE goals
                SET addDate="${params.date}"
                WHERE id = ${params.id}`)

        for (let i = 0; i < params.order.length; i++) {
            db.run(`UPDATE goals
                    SET goal_pos=${i + 1}
                    WHERE id = ${params.order[i]}`)
        }
    })


    ipcMain.handle('ask-edit-goal', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.goal,
                               G.check_state,
                               G.goal_pos,
                               G.category,
                               G.difficulty,
                               G.importance,
                               G.note,
                               G.addDate,
                               G.date_type,
                               PR.id as pr_id
                        FROM goals G
                                 LEFT JOIN projects PR ON PR.id = G.project_id
                        WHERE G.id = ${params.todo_id}
                        ORDER BY G.goal_pos`, (err, goal) => {
                    if (err) console.error(err)
                    else {
                        db.all(`SELECT id, goal_id, step_text, step_check
                                FROM steps
                                WHERE goal_id = ${params.todo_id}`, (err2, steps) => {
                            if (err2) reject(err2)
                            else {
                                resolve([goal[0], steps])
                            }
                        })
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }


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
                        ${params.difficulty}, ${params.importance}, ${project_id}, "${params.note}")`
            if (i < params.dates.length - 1) values += ","
            current_goal_pos++
        }
        values += ";"

        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category, difficulty, importance, project_id, note)
                VALUES ${values}`)


        db.all(`SELECT id
                FROM goals
                WHERE id = (SELECT max(id) FROM goals)`, (err, rows) => {
            let first_id = rows[0].id - params.dates.length + 1

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
        for (let i = 0; i < params.after.length; i++) {
            db.run(`UPDATE goals
                    SET goal_pos=${i + 1}
                    WHERE id = ${params.after[i]}`)
        }
    })

    ipcMain.on('goal-removed', (event, params) => {
        db.run(`DELETE
                FROM goals
                WHERE id = ${params.id}`)
        db.run(`DELETE
                FROM steps
                WHERE goal_id = ${params.id}`)
    })



    ipcMain.on('change-checks-goal', (event, params) => {
        db.run(`UPDATE goals
                SET check_state="${Number(params.state)}"
                WHERE id = ${params.id}`)
    })

    ipcMain.on('change-week-goal-check', (event, params) => {
        db.run(`UPDATE goals
                SET check_state="${Number(params.state)}"
                WHERE id = ${params.id}`)
    })


    ipcMain.on('change-checks-step2', (event, params) => {
        db.run(`UPDATE steps
                SET step_check="${params.state}"
                WHERE id = ${params.id}`)
    })


    ipcMain.on('change-project', (event, params) => {
        let new_project_id = 0
        if (params.project_pos !== -1) new_project_id = project_ids[params.project_pos]
        db.run(`UPDATE goals
                SET project_id="${new_project_id}"
                WHERE id = ${ids_array[params.id]}`)
    })

    ipcMain.handle('edit-goal', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.run(`UPDATE goals
                        SET check_state = ${params.changes['check_state']},
                            goal        = '${params.changes['goal']}',
                            category    = ${params.changes['category']},
                            importance  = ${params.changes['importance']},
                            note        = '${params.changes['note']}',
                            project_id  = ${params.changes['pr_id']},
                            addDate     = '${params.changes['addDate']}',
                            date_type   = ${params.changes['date_type']}
                        WHERE id = ${params.id}`)

                db.run(`DELETE
                        FROM steps
                        WHERE goal_id = ${params.id}`)

                if (params.changes['steps'].length) {
                    let steps_values = ""
                    for (let j = 0; j < params.changes['steps'].length; j++) {
                        steps_values += `("${params.changes['steps'][j].step_text}", ${params.id}, ${params.changes['steps'][j].step_check})`
                        if (j < params.changes['steps'].length - 1) steps_values += ","
                    }
                    steps_values += ";"

                    db.run(`INSERT INTO steps (step_text, goal_id, step_check)
                            VALUES ${steps_values}`)
                    db.all(`SELECT id, step_check, step_text
                            FROM steps
                            WHERE goal_id = ${params.id}`, (err, rows) => {
                        if (err) reject(err)
                        else {
                            resolve(rows)
                        }
                    })
                } else {
                    resolve([])
                }

            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while editing goal.'};
        }


    })

    ipcMain.handle('ask-history', async (event, params) => {
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

        try {
            return await new Promise((resolve, reject) => {
                db.all(query, (err, rows) => {
                    if (err) reject(err)
                    else {
                        history_ids = rows.map((goal) => goal.id)
                        let safe_rows = rows.map(row => {
                            let {id, ...rest} = row;
                            return rest;
                        })
                        resolve(safe_rows)
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
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

                    let safe_steps = steps.map(step => {
                        let {id, goal_id, ...rest} = step;
                        return rest;
                    })

                    console.log("!!!Nieobsługiwany")
                    event.reply('history-to-goal', safe_steps, goal[0])
                })
                current_goal_pos++
            }
        })


    })

    ipcMain.on('side-check-change', (event, params) => {
        let local_ids_array = history_ids
        if (params.option === 2) local_ids_array = project_sidebar_ids
        db.run(`UPDATE goals
                SET check_state=${params.state}
                WHERE id = ${local_ids_array[params.id]}`)
        local_ids_array.splice(params.id, 1)
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
                WHERE id = ${params.id}`)
    })


    ipcMain.on('ask-productivity', (event, params) => {
        db.all(`SELECT date_col, prod
                FROM productivity
                WHERE date_col >= "${params[params.length - 1]}"
                  AND date_col <= "${params[0]}"
                ORDER BY date_col DESC;`, (err, rows) => {
            if (err) console.error(err)
            else {
                db.all(`SELECT G.addDate,
                               G.difficulty,
                               G.importance,
                               G.check_state
                        FROM goals G
                        WHERE G.addDate NOT IN (SELECT P.date_col
                                                FROM productivity P
                                                WHERE P.date_col >= "${params[params.length - 1]}"
                                                  AND P.date_col < "${params[0]}"
                                                GROUP BY P.date_col
                                                ORDER BY P.date_col DESC)
                          AND G.addDate >= "${params[params.length - 1]}"
                          AND G.addDate < "${params[0]}"
                        ORDER BY G.addDate DESC;`, (err2, rows2) => {
                    if (err2) console.error(err2);
                    else {
                        let res = [];
                        for (let date of params) {
                            let flag = true;
                            for (let prod of rows) {
                                if (date == prod.date_col) {
                                    flag = false;
                                    res.push(prod.prod);
                                    break;
                                }
                            }
                            if (flag) {
                                let sum_done = 0;
                                let sum_all = 0;
                                for (let task of rows2) {
                                    if (date == task.addDate && task.importance > 2) {
                                        if (task.check_state == 1) {
                                            sum_done += task.difficulty * task.importance;
                                        }
                                        sum_all += task.difficulty * task.importance;
                                    }
                                }
                                let sum = 0;
                                if (sum_all != 0) {
                                    sum = Math.round(sum_done * 100 / sum_all);
                                } else {
                                    sum = 0;
                                }
                                db.run(`INSERT INTO productivity (date_col, prod)
                                        VALUES ("${date}", "${sum}")`)
                                res.push(sum);
                            }

                        }
                        event.reply('get-productivity', res);
                    }
                })
            }
        })
    })


    ipcMain.handle('get-categories', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM categories
                        ORDER BY id`, (err, categories) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(categories);
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.handle('get-projects', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM projects
                        ORDER BY id`, (err, projects) => {
                    if (err) {
                        reject(err);
                    } else {
                        project_ids = projects.map((project) => project.id)
                        resolve(projects);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching projects.'};
        }
    })

    ipcMain.handle('get-galactic-connections', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM galactic_connections
                        ORDER BY category`, (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching galactic connections.'};
        }

    })

    ipcMain.on('add-category', (event, params) => {
        db.run(`INSERT INTO categories (id, name, r, g, b)
                VALUES ("${params.id}", "${params.name}", "${params.r}", "${params.g}", "${params.b}")`);
    })


    ipcMain.on('ask-galactic-conn', (event) => {
        db.all(`SELECT *
                FROM galactic_connections
                ORDER BY category`, (err, rows) => {
            if (err) console.error(err)
            else {
                event.reply('get-galactic-conn', rows);
            }
        })
    })

    ipcMain.on('change-projects-coords', (event, params) => {
        for (let change of params.changes) {
            db.run(`UPDATE projects
                    SET x="${change.x}",
                        y="${change.y}"
                    WHERE id = ${change.id}`)
        }
    })

    ipcMain.on('change-galactic-connections', (event, params) => {
        for (let change of params.changes) {
            if (change.add) {
                db.run(`INSERT INTO galactic_connections (category, project_from, project_to)
                        VALUES ("${change.category}", "${change.from}", "${change.to}")`)
            } else {
                db.run(`DELETE
                        FROM galactic_connections
                        WHERE category = ${change.category}
                          AND project_from = ${change.from}
                          AND project_to = ${change.to}`)
            }
        }
    })

    ipcMain.on('remove-category', (event, params) => {
        db.run(`DELETE
                FROM categories
                WHERE id = ${params.id}`);
        db.run(`DELETE
                FROM galactic_connections
                WHERE category = ${params.id}`);
        db.run(`DELETE
                FROM projects
                WHERE category = ${params.id}`);
        db.run(`DELETE
                FROM goals
                WHERE category = ${params.id}`);
    })

    ipcMain.handle('save-file', async (event, fileName, fileData, fileSource) => {
        try {
            const appDataPath = path.join(app.getPath('userData'), fileSource);
            if (!fsa.existsSync(appDataPath)) {
                fsa.mkdirSync(appDataPath, {recursive: true});
            }

            const filePath = path.join(appDataPath, fileName);
            const file = fileName.slice(0, fileName.lastIndexOf('.'))
            fsa.writeFileSync(filePath, fileData, 'base64');
            return {success: true, name: file, path: filePath};
        } catch (err) {
            console.error('Failed to save file:', err);
            return {success: false, error: err.message};
        }
    });

    ipcMain.handle('get-icons', async () => {
        try {
            const appDataPath = path.join(app.getPath('userData'), 'icons');

            // Ensure the directory exists
            if (!fsa.existsSync(appDataPath)) {
                return {success: false, files: [], message: 'Icons folder does not exist.'};
            }

            // Read the contents of the directory
            const files = fsa.readdirSync(appDataPath).map((file) => ({
                name: file.slice(0, file.lastIndexOf('.')),
                path: path.join(appDataPath, file),
            }));

            return {success: true, files};
        } catch (err) {
            console.error('Error reading icons folder:', err);
            return {success: false, files: [], message: err.message};
        }
    });

    ipcMain.handle('get-project-icons', async () => {
        try {
            const appDataPath = path.join(app.getPath('userData'), 'project_icons');

            // Ensure the directory exists
            if (!fsa.existsSync(appDataPath)) {
                return {success: false, files: [], message: 'Icons folder does not exist.'};
            }

            // Read the contents of the directory
            const files = fsa.readdirSync(appDataPath).map((file) => ({
                name: file.slice(0, file.lastIndexOf('.')),
                path: path.join(appDataPath, file),
            }));
            return {success: true, files, appDataPath};
        } catch (err) {
            console.error('Error reading icons folder:', err);
            return {success: false, files: [], message: err.message};
        }
    });

    ipcMain.handle('get-inbox', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM inbox
                        WHERE check_state = 0
                        ORDER BY id DESC`, (err, goals) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(goals)
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.handle('new-inbox-goal', async (event, params) => {
        db.run(`INSERT INTO inbox (name, add_date)
                VALUES ("${params.name}", "${params.add_date}")`);

        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM inbox
                        WHERE check_state = 0
                        ORDER BY id DESC
                        LIMIT 1;`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows[0])
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.on('check-inbox-goal', (event, params) => {
        db.run(`UPDATE inbox
                SET check_state = 1
                WHERE id = ${params.id}`)
    })

    ipcMain.on('remove-project', (event, params) => {
        db.run(`DELETE
                FROM projects
                WHERE id = ${params.id}`);
    })

    ipcMain.on('new-goal-from-inbox', (event, params) => {
        db.run(`INSERT INTO goals (goal, addDate, category, project_id, note, date_type)
                VALUES ("${params.goal}", "${params.date}", ${params.category_id},
                        ${params.project_id}, "${params.note}", ${params.date_type})`)

        db.all(`SELECT id
                FROM goals
                WHERE id = (SELECT max(id) FROM goals)`, (err, rows) => {

            let goal_id = rows[0].id

            if (params.steps.length) {
                let steps_values = ""
                for (let j = 0; j < params.steps.length; j++) {
                    steps_values += `("${params.steps[j].step_text}", ${goal_id})`
                    if (j < params.steps.length - 1) steps_values += ","
                }
                steps_values += ";"

                db.run(`INSERT INTO steps (step_text, goal_id)
                        VALUES ${steps_values}`)
            }
        })

        db.run(`DELETE
                FROM inbox
                WHERE id = ${params.inbox_id}`);
    })


    ipcMain.handle('get-habits', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM habits`, (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching habits.'};
        }
    })

    ipcMain.handle('get-habits-days', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM habit_days`, (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching habits days.'};
        }
    })

    ipcMain.handle('get-habits-logs', async () => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM habit_logs`, (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching habits logs.'};
        }
    })

    ipcMain.handle('add-habit', async (event, params) => {
        db.run(`INSERT INTO habits (name, importancy)
                VALUES ("${params.name}", "${3}")`)
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT *
                        FROM habits
                        ORDER BY id DESC
                        LIMIT 1`, (err, rows) => {
                    if (err) reject(err);
                    else {
                        resolve(rows);
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching habits.'};
        }
    })

    ipcMain.on('add-habit-days', (event, params) => {
        params.days.forEach(day => {
            if (day.start_date !== undefined && day.end_date !== undefined) {
                db.run(`INSERT INTO habit_days (habit_id, day_of_week, start_date, end_date)
                        VALUES ("${params.id}", "${day.day_of_week}", "${day.start_date}", "${day.end_date}")`)
            } else {
                db.run(`INSERT INTO habit_days (habit_id, day_of_week)
                        VALUES ("${params.id}", "${day.day_of_week}")`)
            }
        })
    })

    ipcMain.on('add-habit-logs', (event, params) => {
        db.run(`INSERT INTO habit_logs (habit_id, date)
                VALUES ("${params.id}", "${params.date}")`)
    })

    ipcMain.on('remove-habit', (event, params) => {
        db.run(`DELETE
                FROM habits
                WHERE id = ${params.id}`);
        db.run(`DELETE
                FROM habit_days
                WHERE habit_id = ${params.id}`);
        db.run(`DELETE
                FROM habit_logs
                WHERE habit_id = ${params.id}`);
    })

    ipcMain.on('remove-habit-logs', (event, params) => {
        db.run(
            `DELETE FROM habit_logs WHERE habit_id = ? AND date = ?`,
            [params.id, params.date],
            function(err) {
                if (err) {
                console.error('Błąd podczas usuwania:', err.message);
                } 
            }
        );
    })


    ipcMain.handle('get-ASAP', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id,
                               G.goal,
                               G.check_state,
                               G.category,
                               G.date_type,
                               G.importance,
                               PR.category  as pr_category,
                               G.project_id as pr_id,
                               PR.icon      as pr_icon
                        FROM goals G
                                 LEFT JOIN knots KN ON KN.goal_id = G.id
                                 LEFT JOIN projects PR ON PR.id = G.project_id
                        WHERE (date_type = 2 or date_type = 3)
                          AND G.check_state = 0
                        ORDER BY date_type ASC, G.id DESC`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let ids_array = goals.map((goal) => goal.id)
                        let ids_string = `( ${ids_array} )`
                        db.all(`SELECT id, goal_id, step_text, step_check
                                FROM steps
                                WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                            if (err2) reject(err);
                            else {
                                let safe_goals = get_safe_goals2(goals, steps)

                                resolve(safe_goals);

                            }
                        })
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.on('check-ASAP-goal', (event, params) => {
        db.run(`UPDATE goals
                SET check_state = 1
                WHERE id = ${params.id}`)
    })

    ipcMain.handle('new-ASAP-goal', async (event, params) => {
        db.run(`INSERT INTO goals (goal, addDate, goal_pos, category, difficulty, importance, project_id, note,
                                   date_type)
                VALUES ("${params.name}", "${params.add_date}", 0, 0, 2, 2, -1, "", "${params.date_type}")`);

        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id,
                               G.goal,
                               G.check_state,
                               G.goal_pos,
                               G.category,
                               G.difficulty,
                               G.importance,
                               G.date_type,
                               PR.category as pr_category,
                               PR.id       as pr_id,
                               PR.icon     as pr_icon
                        FROM goals G
                                 LEFT JOIN projects PR ON PR.id = G.project_id
                        ORDER BY G.id DESC
                        LIMIT 1;`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows[0])
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.handle('new-goal-2', async (event, params) => {
        console.log(params.changes)
        try {
            return await new Promise((resolve, reject) => {
                db.run(`INSERT INTO goals (goal, addDate, category, importance, project_id, note, date_type)
                        VALUES ('${params.changes['goal']}', '${params.changes['addDate']}',
                                ${params.changes['category']}, ${params.changes['importance']},
                                ${params.changes['pr_id']}, '${params.changes['note']}',
                                ${params.changes['date_type']})`)

                let goal_id = -1
                db.all(`SELECT id
                        FROM goals
                        WHERE id = (SELECT max(id) FROM goals)`, (err, rows) => {
                    goal_id = rows[0].id

                    if (params.changes['steps'].length) {
                        let steps_values = ""
                        for (let j = 0; j < params.changes['steps'].length; j++) {
                            steps_values += `("${params.changes['steps'][j].step_text}", ${goal_id}, ${params.changes['steps'][j].step_check})`
                            if (j < params.changes['steps'].length - 1) steps_values += ","
                        }
                        steps_values += ";"

                        db.run(`INSERT INTO steps (step_text, goal_id, step_check)
                                VALUES ${steps_values}`)
                        db.all(`SELECT id, step_check, step_text
                                FROM steps
                                WHERE goal_id = ${goal_id}`, (err, steps) => {
                            if (err) reject(err)
                            else {
                                resolve([goal_id, steps])
                            }
                        })
                    } else {
                        resolve([goal_id, []])
                    }
                })


            })
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });


    ipcMain.handle('get-deadlines', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                db.all(`SELECT G.id,
                               G.goal,
                               G.check_state,
                               G.goal_pos,
                               G.category,
                               G.importance,
                               G.project_id as pr_id,
                               G.date_type,
                               G.addDate
                        FROM goals G
                        WHERE G.addDate > "${params.date}"
                          and G.date_type = 1
                        ORDER BY addDate, goal_pos`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let rows_ids = goals.map((goal) => goal.id)
                        let ids_string = `( ${rows_ids} )`
                        db.all(`SELECT id, goal_id, step_text, step_check
                                FROM steps
                                WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                            if (err2) reject(err);
                            else {
                                let safe_goals = get_safe_goals2(goals, steps)
                                resolve(safe_goals);
                            }
                        })
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });

    ipcMain.handle('get-day-setup-goals', async (event, params) => {
        try {
            return await new Promise((resolve, reject) => {
                let date = ""
                console.log(params.queue)
                let project_ids = "(-1)"
                let queue_ids = ""
                let deadlines_ids = ""

                if (params.queue !== '()') {
                    project_ids = params.queue
                    queue_ids = `CASE G.project_id ${params.queue_order} END, `
                }

                if (params.deadlines !== '()') {
                    deadlines_ids = `CASE G2.id ${params.deadlines_order} END, `
                }

                console.log(`
                    Select *
                    from (SELECT G.id,
                                 G.goal,
                                 G.check_state,
                                 G.goal_pos,
                                 G.category,
                                 G.importance,
                                 G.project_id as pr_id,
                                 G.date_type,
                                 G.addDate
                          FROM goals G
                          WHERE (addDate = "${date}" and check_state = 0 and (date_type = 0) and
                                 G.project_id IN ${project_ids})
                          ORDER BY ${queue_ids}G.importance DESC, G.goal_pos
                          LIMIT 10)

                    UNION ALL

                    Select *
                    from (SELECT G2.id,
                                 G2.goal,
                                 G2.check_state,
                                 G2.goal_pos,
                                 G2.category,
                                 G2.importance,
                                 G2.project_id as pr_id,
                                 G2.date_type,
                                 G2.addDate
                          FROM goals G2
                          WHERE (G2.addDate >= "${params.date}" and G2.check_state = 0 and (G2.date_type = 1))
                          ORDER BY ${deadlines_ids}G2.addDate
                          LIMIT 10)`)

                db.all(`
                    Select *
                    from (SELECT G.id,
                                 G.goal,
                                 G.check_state,
                                 G.goal_pos,
                                 G.category,
                                 G.importance,
                                 G.project_id as pr_id,
                                 G.date_type,
                                 G.addDate
                          FROM goals G
                          WHERE (addDate = "${date}" and check_state = 0 and (date_type = 0) and
                                 G.project_id IN ${project_ids})
                          ORDER BY ${queue_ids}G.importance DESC, G.goal_pos
                          LIMIT 10)

                    UNION ALL

                    Select *
                    from (SELECT G2.id,
                                 G2.goal,
                                 G2.check_state,
                                 G2.goal_pos,
                                 G2.category,
                                 G2.importance,
                                 G2.project_id as pr_id,
                                 G2.date_type,
                                 G2.addDate
                          FROM goals G2
                          WHERE (G2.addDate >= "${params.date}" and G2.check_state = 0 and (G2.date_type = 1))
                          ORDER BY ${deadlines_ids}G2.addDate
                          LIMIT 10)`, (err, goals) => {
                    if (err) reject(err)
                    else {
                        let rows_ids = goals.map((goal) => goal.id)
                        let ids_string = `( ${rows_ids} )`
                        db.all(`SELECT id, goal_id, step_text, step_check
                                FROM steps
                                WHERE goal_id IN ${ids_string}`, (err2, steps) => {
                            if (err2) reject(err);
                            else {
                                let safe_goals = get_safe_goals2(goals, steps)
                                resolve(safe_goals);
                            }
                        })
                    }
                })
            });
        } catch (error) {
            console.error(error);
            return {error: 'An error occurred while fetching categories.'};
        }
    });
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