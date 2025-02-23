import {check_border, decode_text} from "./data.mjs";

export class Asap {
    constructor(app_data, app_date, app_steps) {
        this.data = app_data
        this.date = app_date
        this.steps = app_steps
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', "#dashASAP", async () => {
            await this.build_view()
        })

        $(document).on('focus', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#1A3667")
        })

        $(document).on('blur', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#2A2A2A")
        })

        $(document).on('click', '#ASAPList .check_task', (event) => {
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()

            $todo.remove()
            window.asapAPI.checkASAPGoal({'id': todo_id})
        })

        $(document).on('click', '#ASAPAdd', async () => {
            await this.new_goal()
        })
    }

    async build_view() {
        const main_template = $('#ASAPMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        let goals = await window.asapAPI.getASAP()
        for (let i = 0; i < goals.length; i++){
            goals[i]['steps'] = this.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = decode_text(goals[i]['goal'])
            $('#ASAPList').append(this.build_goal(goals[i]))
        }
    }

    build_goal(goal) {
        let category_color = ""
        if (goal.category !== 0) {
            category_color = this.data.categories[goal.category][0]
        }
        let project_emblem = this.data.project_emblem_html2(goal.pr_id)

        return `
        <div class='todo'>
            <div class="todoId">${goal.id}</div>
            <div class='todoCheck' style="background: ${category_color}">
                <div class="checkDot"></div>
                <input type='checkbox' class='check_task'>
            </div>
            <div class='taskText'>
                <span class='task'> ${goal.goal} </span>
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
    }

    async new_goal() {
        let $asap_input = $('#ASAPInput')
        let name = $asap_input.val()
        $asap_input.val("")

        let new_goal = await window.asapAPI.newASAPGoal({name: name, add_date: this.date.today_sql})
        console.log(new_goal)
        new_goal['steps'] = ""
        // this.add_todo(new_goal, 0)
        $('#ASAPList').prepend(this.build_goal(new_goal))
    }
}