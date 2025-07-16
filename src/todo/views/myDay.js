export class MyDayView {
    constructor(app) {
        this.app = app
        this.templates = new MyDayViewTemplates(app)
        this.bindEvents()
    }

    bindEvents() {
        $(document).on('click', '#MyDayList .check_task', async (event) => {
            event.stopPropagation()
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()
            $todo.remove()
            await this.app.services.data_updater('change-checks-goal', {id: todo_id, state: 1}, 'PATCH')
        })

        $(document).on('click', '#MyDayList .stepCheck', async (event) => {
            event.stopPropagation()
            await this.app.todo.todoComponents.steps.change_step_check(event.currentTarget)
        })
    }

    async display() {
        $('#main').html(this.templates.view())
        let setup_settings = this.get_settings()
        let params = this.get_my_day_params(setup_settings)

        let new_goals = await this.app.services.data_getter('get-my-day', params)

        const today = this.app.settings.date.today_sql;
        const [today_goals, other_goals] = new_goals.reduce(
            ([g1, g2], item) => {
                if ([2, 3].includes(item.dateType)) {
                    g1.push(item);
                } else if ([0, 1].includes(item.dateType) && item.addDate === today) {
                    g1.push({...item, addDate: today});
                } else {
                    g2.push(item);
                }
                return [g1, g2];
            },
            [[], []]
        );



        let imported_goals = await this.get_goals_setup(today_goals.length, other_goals)
        const rank = {2: 0, 1: 1, 0: 2, 3: 3};

        today_goals.sort((a, b) => {
            if (a.date_type === 2 && b.date_type !== 2) return -1;
            if (b.date_type === 2 && a.date_type !== 2) return 1;

            if (a.date_type === 3 && b.date_type !== 3) return 1;
            if (b.date_type === 3 && a.date_type !== 3) return -1;

            if (a.importance !== b.importance) {
                return b.importance - a.importance;
            }

            return b.date_type - a.date_type;
        });

        let goals = [...today_goals, ...imported_goals]
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.app.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i]['categoryPublicId'])
            goals[i]['name'] = this.app.settings.data.decode_text(goals[i]['name'])
            if (i > today_goals.length - 1) {
                goals[i]['importance'] = 2
            }
            $('#MyDayList').append(this.templates.goal(goals[i]))
        }
    }

    get_my_day_params(setup) {
        console.log(setup.projectQueue)
        return {
            date: this.app.settings.date.today_sql,
            queue_order: setup.projectQueue,
            deadlines_order: setup.deadlines,
        }
    }

    async get_goals_setup(now_length, goals_setup) {
        let setup_settings = this.get_settings()

        let remaining_count = 10 - now_length

        // let queue_formatted = `(${setup_settings.projectQueue.join(',')})`;
        // let queue_order = setup_settings.projectQueue.map((id, idx) => `WHEN ${id} THEN ${idx + 1}`).join('\n') + ` ELSE ${setup_settings.projectQueue.length + 1}`;
        // let deadlines_order = setup_settings.deadlines.map((id, idx) => `WHEN ${id} THEN ${idx + 1}`).join('\n') + ` ELSE ${setup_settings.deadlines.length + 1}`;
        //
        // let deadlines_formatted = `(${setup_settings.deadlines.join(',')})`;
        // let goals_setup = await window.goalsAPI.getDaySetupGoals({
        //     date: this.app.settings.date.today_sql,
        //     queue: queue_formatted,
        //     queue_order: queue_order,
        //     deadlines: deadlines_formatted,
        //     deadlines_order: deadlines_order,
        // })

        let result = []
        const projects_goals = goals_setup
            .filter(item => item.dateType === 0)

        const deadlines_goals = goals_setup
            .filter(item => item.dateType === 1)

        let remaining_length = remaining_count * (setup_settings.project_share / 100)
        let projects_max_length = Math.round(remaining_length)
        let deadlines_max_length = remaining_count - projects_max_length

        if (projects_goals.length < projects_max_length) {
            result = [...projects_goals, ...deadlines_goals.slice(0, remaining_count - projects_goals.length)]
        } else if (deadlines_goals.length < deadlines_max_length) {
            result = [...projects_goals.slice(0, remaining_count - deadlines_goals.length), ...deadlines_goals]
        } else {
            result = [...projects_goals.slice(0, projects_max_length), ...deadlines_goals.slice(0, deadlines_max_length)]
        }

        return result
    }

    get_settings() {
        let myDaySetup = {
            projectQueue: [],
            deadlines: [],
            project_share: 50,
            deadline_share: 50
        };
        const raw = localStorage.getItem(this.app.settings.data.localStorage);
        if (raw !== null) {
            try {
                myDaySetup = JSON.parse(raw);
            } catch (e) {
                console.error("Failed to parse myDaySetupState:", e);
            }
        }

        return myDaySetup;
    }
}

class MyDayViewTemplates {
    constructor(app) {
        this.app = app
    }

    view() {
        return `
            <div id="MyDayHeader">
                <div id="dashOpen">
                    <img src="images/goals/back.png" alt="">
                </div>
                My Day
            </div>
            <div id="MyDayBody">
                <div id="MyDayList">
                    
                </div> 
                <div id="MyDayFooter">
                    <div id="MyDaySetup">
                        Setup
                    </div>
                </div>
                
            </div>`
    }

    goal(goal) {
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        let date_label = ""
        let deadline_label = ""

        if (goal.categoryPublicId !== null) {
            category_color = this.app.settings.data.categories.categories[goal['categoryPublicId']][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let check_color = this.app.settings.data.check_border[goal.importance]
        let fire_emblem = ""

        if (goal['dateType'] === 0 && goal.addDate !== null) {
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        } else if (goal['dateType'] === 1) {
            if (goal['addDate'] === this.app.settings.date.today_sql) {
                deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
            } else {
                deadline_label = `<img src="images/goals/hourglass2.png" class="todoDeadline">`
            }
        } else if (goal['dateType'] === 2) {
            check_color = this.app.settings.data.check_border[4]
            fire_emblem = `<img src="images/goals/fire1.png" class="ASAPLabel" alt="">`
        }

        let project_emblem = this.app.settings.data.projects.project_emblem_html(goal['projectPublicId'])

        return `
        <div class='todo' style="${category_border}">
            <div class="todoId">${goal['publicId']}</div>
            <div class='todoCheck'>
                <input type='checkbox' class='check_task' style="border-color:${check_color}; color:${check_color}">
            </div>
            <div class='taskText'>
                <span class='task'> 
                    ${goal['name']}
                    ${fire_emblem}
                    ${deadline_label}
                    ${date_label}
                 </span>
                ${goal['steps']}
            </div>
            ${project_emblem}
        </div>`
    }
}

