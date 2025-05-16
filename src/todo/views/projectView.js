export class ProjectView {
    constructor(todo) {
        this.initEventListeners()
        this.todo = todo

        this.current_goal_id = 0
        this.block_prev_drag = 0
    }

    initEventListeners() {
        $(document).on('click', '#projectContent .check_task', (event) => {
            event.stopPropagation()
            let selected_goal = $(event.currentTarget).closest('.todo')
            this.change_project_check(selected_goal)
        });

        $(document).on('click', '#projectDelete', () => {
            $("#vignette").css('display', 'block')
            const delete_project_template = $('#deleteprojectTemplate').prop('content');
            let $delete_clone = $(delete_project_template).clone()
            $("#vignette").append($delete_clone)
        })

        $(document).on('click', '#projectContent .stepCheck', (event) => {
            event.stopPropagation()
            this.todo.todoComponents.steps.change_step_check(event.currentTarget)
            this.dragula_project_view()
        });
    }

    /**
     * Displays project view
     */
    async display(selected_project) {
        if ($(selected_project).attr('class') === 'projectEmblem'){
            this.project_id = Number($(selected_project).find('.projectPos').text())
        }
        else if ($(selected_project).hasClass('dashButton')){
            this.project_id = Number($(selected_project).find('.dashProjectId').text())
        }
        this.selected_project = this.todo.appSettings.data.projects.projects.find(item => item.id === this.project_id)
        let project_color = this.todo.appSettings.data.categories.categories[this.selected_project['category']][0]
        let project_icon = this.todo.appSettings.data.projects.findProjectPathByName(`project${this.selected_project['id']}`)
        let project_name = this.selected_project['name']

        this.todo.appSettings.data.show_hide_sidebar(true, 1)
        this.set_project_view(project_color, project_icon, project_name)

        let goals = await window.goalsAPI.getProjectView({project_pos: this.selected_project['id']})
        this.build_project_view(goals)
    }

    /**
     * BUild project view from templates
     */
    set_project_view(color, icon, name) {
        const header_template = $('#projectViewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()

        $header_clone.find('#projectHeader').css('border-color', color)
        $header_clone.find('#projectHeaderIcon').attr('src', icon)
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
            goals[i]['steps'] = this.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = this.todo.appSettings.data.decode_text(goals[i]['goal'])
            if (Number(goals[i]['check_state']) === 1) $('#projectDone .projectSectionGoals').append(this.build_project_goal(goals[i]))
            else if (goals[i]['addDate'] !== "") $('#projectDoing .projectSectionGoals').append(this.build_project_goal(goals[i]))
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
        }).on('drop', (event) => {
            let drag_parent_id = dragged_task.closest('.projectSection').attr('id')
            let drop_parent_id = $(event).closest('.projectSection').attr('id')

            if (drag_parent_id !== 'projectDone' && drop_parent_id === 'projectDone') {
                this.move_to_done(event, dragged_task)
            } else if (drag_parent_id !== 'projectTodo' && drop_parent_id === 'projectTodo') {
                this.move_to_todo(event, dragged_task)
            }
        })
    }

    /**
     * project goal type change to done by drag
     * @param new_goal_pos new position of moved goal
     * @param dragged_task pressed task
     */
    move_to_done(new_goal, dragged_task) {
        let goal_id = $(dragged_task).find('.todoId').text()
        $(dragged_task).remove()
        window.goalsAPI.changeChecksGoal({id: goal_id, state: 1, option: 0})
        $(new_goal).find('.check_task').prop('checked', true)
    }

    /**
     * project goal type change to goals by drag
     * @param new_goal_pos new position of moved goal
     * @param dragged_task pressed task
     */
    move_to_todo(new_goal, dragged_task) {
        let goal_id = $(dragged_task).find('.todoId').text()
        $(dragged_task).remove()
        window.goalsAPI.goalRemoveDate({id: goal_id})
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

        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let check_state = goal.check_state ? "checked" : "";
        let check_color = this.todo.appSettings.data.check_border[goal.importance]

        return `
            <div class='todo' style="${category_border}">
                <div class="todoId">${goal["id"]}</div>
                <div class='todoCheck'>
                    <input type='checkbox' class='check_task' ${check_state} style="border-color:${check_color}; color:${check_color}">
                </div>
                <div class='taskText'>
                    <span class='task'> ${goal.goal} </span>
                    ${goal.steps}
                </div>
            </div>`
    }

    /**
     * changes check of project goal on checkbox click
     * @param that pressed checkbox of goal
     */
    change_project_check(selected_goal) {
        let check_state = !selected_goal.find('.check_task').prop('checked')
        let goal_id = selected_goal.find('.todoId').text()

        if (check_state) {
            selected_goal.find('.checkDot').css('background-image', ``)
            $('#projectTodo .projectSectionGoals').append(selected_goal)
            window.goalsAPI.goalRemoveDate({id: goal_id})
        } else {
            selected_goal.find('.checkDot').css('background-image', `url('images/goals/check.png')`)
            $('#projectDone .projectSectionGoals').append(selected_goal)
            window.goalsAPI.changeChecksGoal({id: goal_id, state: 1})
        }
        this.dragula_project_view()
    }
}