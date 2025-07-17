export class ProjectView {
    constructor(app) {
        this.initEventListeners()
        this.app = app

        this.current_goal_id = 0
        this.block_prev_drag = 0
    }

    initEventListeners() {
        $(document).on('click', '#projectContent .check_task', async (event) => {
            event.stopPropagation()
            let selected_goal = $(event.currentTarget).closest('.todo')
            await this.change_project_check(selected_goal)
        });

        $(document).on('click', '#projectDelete', () => {
            $("#vignette").css('display', 'block')
            const delete_project_template = $('#deleteprojectTemplate').prop('content');
            let $delete_clone = $(delete_project_template).clone()
            $("#vignette").append($delete_clone)
        })

        $(document).on('click', '#projectContent .stepCheck', async (event) => {
            event.stopPropagation()
            await this.app.todo.todoComponents.steps.change_step_check(event.currentTarget)
            this.dragula_project_view()
        });
    }

    /**
     * Displays project view
     */
    async display(selected_project) {
        if ($(selected_project).attr('class') === 'projectEmblem'){
            this.project_id = $(selected_project).find('.projectPos').text()
        }
        else if ($(selected_project).hasClass('dashButton')){
            this.project_id = $(selected_project).find('.dashProjectId').text()
        }


        this.selected_project = this.app.settings.data.projects.projects.find(item => item.publicId === this.project_id)
        let project_color = this.app.settings.data.categories.categories[this.selected_project['categoryPublicId']][0]
        let project_icon = this.selected_project['svgIcon']
        let project_name = this.selected_project['name']
        this.app.settings.data.show_hide_sidebar(true, 1)
        this.set_project_view(project_color, project_icon, project_name)

        // let goals = await window.goalsAPI.getProjectView({project_pos: this.selected_project['publicId']})
        let goals = await this.app.services.data_getter('get-project-view', {project_id: this.project_id})

        this.build_project_view(goals)
    }

    /**
     * BUild project view from templates
     */
    set_project_view(color, icon, name) {
        const header_template = $('#projectViewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()

        $header_clone.find('#projectHeader').css('border-color', color)
        $header_clone.find('#projectHeaderIcon').html(icon)
        $header_clone.find('#projectName').text(name)
        $header_clone.find('#projectId').text(this.project_id)

        const main_template = $('#projectViewMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()

        $main_clone.find('.projectSectionTitle').css('border-color', color)

        const input_template = $('#todoInputTemplate').prop('content');
        let $input_clone = $(input_template).clone()
        $('#main').html($header_clone)
        $('#main').append($main_clone)
        $('#projectContent').append($input_clone)
    }

    /**
     * Builds project view using received goals data
     * Depending on goal type it goes to specific container
     * @param goals goals data
     */
    build_project_view(goals) {
        this.current_goal_id = 0
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.app.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].categoryPublicId)
            goals[i]['name'] = this.app.settings.data.decode_text(goals[i]['name'])
            if (Number(goals[i]['checkState']) === 1) $('#projectDone .projectSectionGoals').append(this.build_project_goal(goals[i]))
            else if (goals[i]['addDate']) $('#projectDoing .projectSectionGoals').append(this.build_project_goal(goals[i]))
            else $('#projectTodo .projectSectionGoals').append(this.build_project_goal(goals[i]))
        }
        this.dragula_project_view()
    }

    /**
     * Drag and Drop for project view
     */
    dragula_project_view() {
        this.block_prev_drag = 0
        let dragged_task

        dragula(Array.from($('.projectSectionGoals')), {
            copy: () => {
                return true
            },
            accepts: (el, target) => {
                this.block_prev_drag = 0
                return $(target).parent().attr('id') !== "projectDoing";
            },
            moves: () => {
                if (this.block_prev_drag === 0) {
                    this.block_prev_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            this.block_prev_drag = 0
            dragged_task = $(event)
        }).on('drop', async (event) => {
            let drag_parent_id = dragged_task.closest('.projectSection').attr('id')
            let drop_parent_id = $(event).closest('.projectSection').attr('id')

            if (drag_parent_id !== 'projectDone' && drop_parent_id === 'projectDone') {
                await this.move_to_done(event, dragged_task)
            } else if (drag_parent_id !== 'projectTodo' && drop_parent_id === 'projectTodo') {
                await this.move_to_todo(event, dragged_task)
            }
        })
    }

    /**
     * project goal type change to done by drag
     * @param new_goal_pos new position of moved goal
     * @param dragged_task pressed task
     */
    async move_to_done(new_goal, dragged_task) {
        let goal_id = $(dragged_task).find('.todoId').text()
        $(dragged_task).remove()
        await this.app.services.data_updater('change-checks-goal', {id: goal_id, state: 1}, 'PATCH')
        $(new_goal).find('.check_task').prop('checked', true)
    }

    /**
     * project goal type change to goals by drag
     * @param new_goal_pos new position of moved goal
     * @param dragged_task pressed task
     */
    async move_to_todo(new_goal, dragged_task) {
        let goal_id = $(dragged_task).find('.todoId').text()
        $(dragged_task).remove()
        await this.app.services.data_updater('goal-remove-date', {id: goal_id}, 'PATCH')
        $(new_goal).find('.check_task').prop('checked', false)
    }

    /**
     * creates HTML of project goal
     * @param goal data of project goal
     * @returns {string} project goal in HTML format
     */
    build_project_goal(goal) {
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""

        if (goal.categoryPublicId !== 0 && goal.categoryPublicId !== null) {
            category_color = this.app.settings.data.categories.categories[goal.categoryPublicId][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let check_state = goal.checkState ? "checked" : "";
        let check_color = this.app.settings.data.check_border[goal.importance]
        let goal_text = this.app.settings.data.decode_text(goal["name"])

        return `
            <div class='todo' style="${category_border}">
                <div class="todoId">${goal["publicId"]}</div>
                <div class='todoCheck'>
                    <input type='checkbox' class='check_task' ${check_state} style="border-color:${check_color}; color:${check_color}">
                </div>
                <div class='taskText'>
                    <span class='task'> ${goal_text} </span>
                    ${goal.steps}
                </div>
            </div>`
    }

    /**
     * changes check of project goal on checkbox click
     * @param that pressed checkbox of goal
     */
    async change_project_check(selected_goal) {
        let check_state = !selected_goal.find('.check_task').prop('checked')
        let goal_id = selected_goal.find('.todoId').text()

        if (check_state) {
            selected_goal.find('.checkDot').css('background-image', ``)
            $('#projectTodo .projectSectionGoals').append(selected_goal)
            await this.app.services.data_updater('goal-remove-date', {id: goal_id}, 'PATCH')
        } else {
            selected_goal.find('.checkDot').css('background-image', `url('images/goals/check.png')`)
            $('#projectDone .projectSectionGoals').append(selected_goal)
            await this.app.services.data_updater('change-checks-goal', {id: goal_id, state: 1}, 'PATCH')
        }
        this.dragula_project_view()
    }
}