export class AsapView {
    constructor(app) {
        this.app = app
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('focus', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#1A3667")
        })

        $(document).on('blur', '#ASAPInput', () => {
            $('#ASAPEntry').css('background-color', "#2A2A2A")
        })

        $(document).on('click', '#ASAPList .check_task', async (event) => {
            event.stopPropagation()
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()

            $todo.remove()
            await this.app.services.data_updater('check-asap-goal', {id: todo_id}, 'PATCH')
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

        $(document).on('click', '#ASAPList .stepCheck', async (event) => {
            event.stopPropagation()
            await this.app.todo.todoComponents.steps.change_step_check(event.currentTarget)
        })
    }

    async display() {
        const main_template = $('#ASAPMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.app.settings.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        let goals = await this.app.services.data_getter('get-asap', {})
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.app.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].categoryPublicId)
            goals[i]['name'] = this.app.settings.data.decode_text(goals[i]['name'])
            $('#ASAPList').append(this.build_goal(goals[i]))
        }
    }

    build_goal(goal) {
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        console.log(goal.categoryPublicId)
        if ( goal.categoryPublicId !== null) {
            category_color = this.app.settings.data.categories.categories[goal.categoryPublicId][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let project_emblem = this.app.settings.data.projects.project_emblem_html(goal.projectPublicId)

        let check_color = this.app.settings.data.check_border[goal.importance]
        let fire_emblem = ""
        if (goal.dateType === 2) {
            check_color = this.app.settings.data.check_border[4]
            fire_emblem = `<img src="images/goals/fire1.png" class="ASAPLabel" alt="">`
        }

        return `
        <div class='todo' style="${category_border}">
            <div class="todoId">${goal.publicId}</div>
            <div class='todoCheck'>
                <input type='checkbox' class='check_task' style="border-color:${check_color}; color:${check_color}">
            </div>
            <div class='taskText'>
                <span class='task'> 
                    ${goal.name} 
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

        let new_goal = await this.app.services.data_poster('new-asap-goal', {name: name, addDate: this.app.settings.date.today_sql, dateType: date_type})
        new_goal['steps'] = ""

        if (date_type === 2) {
            $('#ASAPList').prepend(this.build_goal(new_goal))
        } else if (date_type === 3) {
            let where_to_insert = $('.ASAPLabel').length

            $('#ASAPList').children().eq(where_to_insert-1).after(this.build_goal(new_goal))

        }
    }
}