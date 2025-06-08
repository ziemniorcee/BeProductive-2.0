export class MyDayView {
    constructor(todo) {
        this.todo = todo
        this.templates = new MyDayViewTemplates(todo)
        this.bindEvents()
    }

    bindEvents() {
        $(document).on('click', '#MyDayList .check_task', (event) => {
            event.stopPropagation()
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()
            $todo.remove()
            window.goalsAPI.changeChecksGoal({id: todo_id, state: 1})
        })

        $(document).on('click', '#MyDayList .stepCheck', (event) => {
            event.stopPropagation()
            this.todo.todoComponents.steps.change_step_check(event.currentTarget)
        })


    }

    async display() {
        $('#main').html(this.templates.view())

        let today_goals = await window.goalsAPI.getMyDay({date: this.todo.appSettings.date.today_sql})
        let imported_goals = await this.get_goals_setup(today_goals.length)
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
        console.log(goals)
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = this.todo.appSettings.data.decode_text(goals[i]['goal'])
            if (i > today_goals.length - 1) {
                goals[i]['importance'] = 2
            }
            $('#MyDayList').append(this.templates.goal(goals[i]))
        }
    }

    async get_goals_setup(now_length) {
        let setup_settings = this.get_settings()

        let remaining_count = 10 - now_length

        let queue_formatted = `(${setup_settings.projectQueue.join(',')})`;
        let queue_order = setup_settings.projectQueue.map((id, idx) => `WHEN ${id} THEN ${idx + 1}`).join('\n') + ` ELSE ${setup_settings.projectQueue.length + 1}`;
        let deadlines_order = setup_settings.deadlines.map((id, idx) => `WHEN ${id} THEN ${idx + 1}`).join('\n') + ` ELSE ${setup_settings.deadlines.length + 1}`;

        let deadlines_formatted = `(${setup_settings.deadlines.join(',')})`;
        let goals_setup = await window.goalsAPI.getDaySetupGoals({
            date: this.todo.appSettings.date.today_sql,
            queue: queue_formatted,
            queue_order: queue_order,
            deadlines: deadlines_formatted,
            deadlines_order: deadlines_order,
        })

        let result = []
        const projects_goals = goals_setup
            .filter(item => item.date_type === 0)

        const deadlines_goals = goals_setup
            .filter(item => item.date_type === 1)

        let remaining_length = remaining_count * (setup_settings.project_share / 100)
        let projects_max_length = Math.round(remaining_length)
        let deadlines_max_length = remaining_count - projects_max_length

        if (projects_goals.length < projects_max_length) {
            result = [...projects_goals, ...deadlines_goals.slice(0, remaining_count - projects_goals.length)]
        }
        else if (deadlines_goals.length < deadlines_max_length) {
            result = [...projects_goals.slice(0, remaining_count - deadlines_goals.length), ...deadlines_goals]
        }
        else {
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
        const raw = localStorage.getItem(this.todo.appSettings.data.localStorage);
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
    constructor(todo) {
        this.todo = todo
    }

    view() {
        return `
            <div id="MyDayHeader">My Day</div>
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

        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let check_color = this.todo.appSettings.data.check_border[goal.importance]
        let fire_emblem = ""

        if (goal.date_type === 0 && goal.addDate !== "") {
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        } else if (goal.date_type === 1) {
            if (goal.addDate === this.todo.appSettings.date.today_sql) {
                deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
            } else {
                deadline_label = `<img src="images/goals/hourglass2.png" class="todoDeadline">`
            }
        } else if (goal.date_type === 2) {
            check_color = this.todo.appSettings.data.check_border[4]
            fire_emblem = `<img src="images/goals/fire1.png" class="ASAPLabel" alt="">`
        }

        let project_emblem = this.todo.appSettings.data.projects.project_emblem_html(goal.pr_id)

        return `
        <div class='todo' style="${category_border}">
            <div class="todoId">${goal.id}</div>
            <div class='todoCheck'>
                <input type='checkbox' class='check_task' style="border-color:${check_color}; color:${check_color}">
            </div>
            <div class='taskText'>
                <span class='task'> 
                    ${goal.goal}
                    ${fire_emblem}
                    ${deadline_label}
                    ${date_label}
                 </span>
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
    }
}