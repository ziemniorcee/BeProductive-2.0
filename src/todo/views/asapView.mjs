export class AsapView {
    constructor(todo) {
        this.todo = todo
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('focus', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#1A3667")
        })

        $(document).on('blur', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#2A2A2A")
        })

        $(document).on('click', '#ASAPList .check_task', (event) => {
            event.stopPropagation()
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()

            $todo.remove()
            window.asapAPI.checkASAPGoal({'id': todo_id})
        })

        $(document).on('click', '#ASAPFire', async () => {
            if ($('#ASAPFire img').attr('src') === 'images/goals/fire0.png') {
                $('#ASAPFire img').attr('src', 'images/goals/fire1.png')
                $('#ASAPFireASAP').css('display', 'block')
                $("#ASAPFire").css('border', '1px solid red')
            } else {
                $('#ASAPFire img').attr('src', 'images/goals/fire0.png')
                $('#ASAPFireASAP').css('display', 'none')
                $("#ASAPFire").css('border', 'none')
            }
        })

        $(document).on('click', '#ASAPAdd', async () => {
            await this.new_goal()
        })

        $(document).on('keydown', '#ASAPInput', async (event) => {
            if (event.key === 'Enter') {
                await this.new_goal();
            }
        });

        $(document).on('click', '#ASAPList .stepCheck', (event) => {
            event.stopPropagation()
            this.todo.todoComponents.steps.change_step_check(event.currentTarget)
        })
    }

    async display() {
        const main_template = $('#ASAPMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.todo.appSettings.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        let goals = await window.asapAPI.getASAP()

        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = this.todo.appSettings.data.decode_text(goals[i]['goal'])
            $('#ASAPList').append(this.build_goal(goals[i]))
        }
    }

    build_goal(goal) {
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let project_emblem = this.todo.appSettings.data.projects.project_emblem_html(goal.pr_id)

        console.log(goal.importance)
        let check_color = this.todo.appSettings.data.check_border[goal.importance]
        let fire_emblem = ""
        if (goal.date_type === 2) {
            check_color = this.todo.appSettings.data.check_border[4]
            fire_emblem = `<img src="images/goals/fire1.png" class="ASAPLabel" alt="">`
        }

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
                 </span>
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
    }

    async new_goal() {
        let $asap_input = $('#ASAPInput')
        let name = $asap_input.val()
        $asap_input.val("")
        let date_type = 3

        if ($('#ASAPFire img').attr('src') === 'images/goals/fire1.png') date_type = 2

        let new_goal = await window.asapAPI.newASAPGoal({name: name, add_date: this.todo.appSettings.date.today_sql, date_type: date_type})
        new_goal['steps'] = ""

        if (date_type === 2) {
            $('#ASAPList').prepend(this.build_goal(new_goal))
        } else if (date_type === 3) {
            let where_to_insert = $('.ASAPLabel').length

            $('#ASAPList').children().eq(where_to_insert-1).after(this.build_goal(new_goal))

        }
    }
}