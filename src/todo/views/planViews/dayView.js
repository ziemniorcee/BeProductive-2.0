export class DayView {
    constructor(app) {
        this.app = app
        this.initEventListeners()
    }


    initEventListeners() {
        $(document).on('drop', '.todo', () => {
            dragged_task.css('background-color', "#FFFFFF")
        })

        $(document).on('click', '#todosAll .check_task', async (event) => {
            event.stopPropagation()
            let position = $('.check_task').index(event.currentTarget)
            await this.change_main_check(position)
        });

        $(document).on('click', '#todosAll .stepCheck', async (event) => {
            event.stopPropagation()
            await this.app.todo.todoComponents.steps.change_step_check(event.currentTarget)
            this.dragula_day_view()
        });

        /**
         * opens context menu for goals goal and saves selected goal
         */
        $(document).on('contextmenu', '.todo, .monthTodo', (event) => {
            if ($(event.currentTarget).find('.repeatLabelShow').length) window.appAPI.contextMenuOpen({repeat: 1})
            else window.appAPI.contextMenuOpen({repeat: 0, option: 0})
            this.todo_to_remove = event.target
        })

        /**
         * opens context menu for sidebar goal and saves selected sidebar goal
         */
        $(document).on('contextmenu', '.sidebarTask', (event) => {
            if ($(event.currentTarget).parents('.historyTasks').length) window.appAPI.contextMenuOpen({
                repeat: 0,
                option: 1
            })
            else window.appAPI.contextMenuOpen({repeat: 0, option: 2})
            this.todo_to_remove = event.target
        })

        /**
         * opens context menu for sidebar project goal and saves selected sidebar project goal
         */
        $(document).on('contextmenu', '#sideProjectGoals .todo', (event) => {
            window.appAPI.contextMenuOpen({repeat: 0, option: 3})
            this.todo_to_remove = event.target
        })

        $(document).on('click', '#testPanelClear', () => {
            this.remove_goal()
        })

        /**
         * removes goal after context menu click
         */
        window.goalsAPI.removingGoal(async () => {
            await this.remove_goal()
        })


        $(document).on('click', '#testPanelRemoveHistory', () => {
            this.remove_history()
        })


        $(document).on('click', '#testPanelRemoveIdea', () => {
            this.remove_idea()
        })

        /**
         * removes project goal
         */
        // window.sidebarAPI.removingProjectGoal(() => {
        //     console.log("CHUJ")
        //     window.sidebarAPI.projectGoalRemoved({id: $(Number(this.todo_to_remove).find('.todoId').text())})
        //     this.todo_to_remove.remove()
        // })

        $(document).on('click', '.sidebarTask', function () {
            this.is_day_drag = 0
        })

        $(document).on('click', '#todosAll .projectEmblem', async (event) => {
            event.stopPropagation()
            await this.app.todo.todoViews.projectView.display(event.currentTarget)
        });
    }

    /**
     * Displays day view in #main
     * builds view, gets goals, allows drag&drop and closes edit
     */
    async display() {
        let params = {date: this.app.settings.date.today_sql}
        let goals = await this.app.services.data_getter('get-day-view', params)
        this.set_day_html()
        this.set_goals(goals)

        let rightbar = $('#rightbar')
        rightbar.html(rightbar.html())

        this.dragula_day_view()
        this.app.settings.data.projects.set_projects_options()
    }

    set_day_html() {
        let main_title = this.app.settings.date.get_day_view_header()
        let date = this.app.settings.date.get_display_format(this.app.settings.date.day_sql)

        const header_template = $('#viewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()

        $header_clone.find('#mainTitle').text(main_title)
        $header_clone.find('#date').text(date)

        $header_clone.find('.viewOption').css('background-color', '#121212')
        $header_clone.find('#dayViewButton').css('background-color', '#2979FF')
        $header_clone.find('.viewOption2 img').eq(0).attr('src', 'images/goals/dayview.png')

        const content_template = $('#dayViewContentTemplate').prop('content');
        let $content_clone = $(content_template).clone()

        const input_template = $('#todoInputTemplate').prop('content');
        let $input_clone = $(input_template).clone()

        $( () => {
            $("#planDatePicker").datepicker({
                dateFormat: "dd.mm.yy",

                onSelect: async (dateText, inst) => {
                    const $input = inst.input;
                    const selectedDate = $input.datepicker('getDate');
                    this.app.settings.date.set_attributes(selectedDate)
                    await this.display()
                    $('#mainTitle').text(this.app.settings.date.get_day_view_header())

                    $('#selectDate').text(selectedDate)
                    $('#planDateSelector').css('display', 'none')
                }
            });
        });

        $('#main').html($header_clone)
        $('#main').append($content_clone)
        $('#content').append($input_clone)
    }

    /**
     * Gets goals from ipcHandlers
     * 1st it iterates thorough goals and appends them to proper to do section
     * 2nd it
     * @param goals data of goals
     */
    set_goals(goals) {
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.app.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['name'] = this.app.settings.data.decode_text(goals[i]['name'])

            let todo_area = goals[i]['checkState'] ? "#todosFinished" : "#todosArea";
            $(todo_area).append(this.build_goal(goals[i]))
        }

        this.build_finished_count()
    }

    /**
     * builds goal from given data and returns HTML
     * @param goal dict of goal's data
     * @returns {string} HTML of built goal
     */
    build_goal(goal) {
        console.log(goal)
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        let date_label = ""
        let deadline_label = ""

        if (goal.categoryPublicId !== null && goal.categoryPublicId !== '0') {
            category_color = this.app.settings.data.categories.categories[goal.categoryPublicId][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        if(goal.dateType === 0){
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        }
        else if(goal.dateType === 1){
            deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
        }
        let check_state = goal.checkState ? "checked" : "";
        let project_emblem = this.app.settings.data.projects.project_emblem_html(goal["projectPublicId"])
        let check_color = this.app.settings.data.check_border[goal.importance]
        let goal_text = this.app.settings.data.decode_text(goal["name"])

        return `
            <div class='todo' style="${category_border}">
                <div class="todoId">${goal["publicId"]}</div>
                <div class='todoCheck'>
                    <input type='checkbox' class='check_task' ${check_state} style="border-color:${check_color}; color:${check_color}">
                </div>
                <div class='taskText'>
                    <span class='task'> 
                        ${goal_text} 
                        ${deadline_label}
                        ${date_label}
                     </span>
                    ${goal.steps}
                </div>
                ${project_emblem}
            </div>`
    }

    /**
     * Counts goals finished goals
     * if there are finished goals it adds button for finished goals
     */
    build_finished_count() {
        let finished_count = $('#todosFinished .todo').length
        $('#finishedButton').css('display', finished_count ? "block" : "none")
        $("#finishedCount").html(finished_count);
    }

    /**
     * Sets drag and drop for day view
     * if edit in not on rightbar resets
     * depends if project sidebar is on, dragula elements are selected
     */
     dragula_day_view() {
        this.is_day_drag = 0
        let dragged_task
        let dragula_array
        let todos_area_before

        let is_project_sidebar = $('#sideProjectHeader').length

        if (is_project_sidebar) {
            dragula_array = Array.from($('#sideProjectGoals')).concat([document.querySelector("#todosArea")])
        } else {
            dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])
        }

        dragula(dragula_array, {
            copy: (el) => {
                return el.parentNode.id !== "todosArea";
            },
            accepts: (el, target) => {
                this.is_day_drag = 0
                return target.parentNode.id === "todosAll";
            },
            moves: (el) => {

                let is_in = $(el).find('.alreadyEmblem').length
                let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'
                if (this.is_day_drag === 0 && is_in === 0 && !is_done) {
                    this.is_day_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            dragged_task = $(event)
            dragged_task.css('background-color', "#141414")

            this.is_day_drag = 0
            todos_area_before = Array.from($('#todosArea').children())
        }).on('drop', async (event) => {
            dragged_task.css('background-color', "rgba(255, 255, 255, 0.05)")

            let new_goal_pos = $('.todo').index($(event))
            let todos_area_after = Array.from($('#todosArea').children())

            if (todos_area_after.length !== todos_area_before.length) {
                if (dragged_task.attr('class') === "sidebarTask") this._get_from_history(dragged_task)
                else if (dragged_task.parent().attr('id') === "sideProjectGoals") {
                    await this._get_from_project(new_goal_pos, dragged_task)
                }
            } else {
                await this.change_order()
            }

        }).on('cancel', function () {
            dragged_task.css('background-color', "rgba(255, 255, 255, 0.05)")
        });
    }

    /**
     * Gets goal from history by drag
     * @param dragged_task dragged history task
     */
    _get_from_history(dragged_task) {

        if (dragged_task.closest('.historyTasks').children().length > 1) dragged_task.closest('.sidebarTask').remove()
        else dragged_task.closest('.day').remove()
    }

    /**
     * gets goal from project sidebar by drag
     * @param new_goal_index new position of goal
     * @param dragged_task selected goal
     */
    async _get_from_project(new_goal_index, dragged_task) {
        let todos = $('#main .todo')
        let id = dragged_task.find('.todoId').text()

        let project_pos = $('#sideProjectId').text()
        todos.eq(new_goal_index).append(this.app.settings.data.projects.project_emblem_html(project_pos))
        await this.app.todo.project.get_goal_from_sidebar(this.app.settings.date.day_sql, id, new_goal_index)


        $(dragged_task).remove()
    }

    /**
     * fixes order of goals and saves it
     */
    async change_order() {
        let goals = $('#main .todoId')
        if ($('#monthGrid').length) goals = $('#main .monthTodoId')
        let order = []
        for (let i = 0; i < goals.length; i++) order.push(goals.eq(i).text())
        await this.app.services.data_updater('goals-reorder', {order: order}, 'PUT')

    }


    async remove_goal() {
        let id = $(this.todo_to_remove).find('.todoId').text()
        if ($('#monthGrid').length) id = $(this.todo_to_remove).find('.monthTodoId').text()

        await this.app.services.data_deleter('delete-goal', {id: id})

        if ($('#todosAll').length) {
            if ($(this.todo_to_remove).find('.check_task').prop('checked')) {
                let finished_count = $('#todosFinished .todo').length
                if (finished_count === 1) $('#finishedButton').css('display', 'none')
                $('#finishedCount').html(finished_count - 1)
            }
        }
        this.todo_to_remove.remove()
    }

    /**
     * finds how many positions are lesser than selected position
     * @param value checked goal
     * @param array positions of goals to delete
     * @returns position of sorte
     */
    get_shift(value, array) {
        let new_arr = array.slice()
        new_arr.push(value)
        new_arr.sort((a, b) => a - b)
        return new_arr.indexOf(value)
    }





    /**
     * changes check of goals
     * @param position selected goal position
     */
    async change_main_check(position) {
        const $check_task = $('.check_task').eq(position)
        let $todo = $('.todo').eq(position)
        let $todo_id = $('.todoId')
        let $steps_checks = $todo.find('.stepCheck')

        let steps_checks_states = $steps_checks.map(function () {
            return $(this).prop('checked');
        })

        let id = $todo_id.eq(position).html()
        let state = Number($check_task.prop('checked'))
        let importance_color = $todo.find('.check_task').css("border-color")

        $check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task' style="border-color:${importance_color}">`)

        for (let i = 0; i < $steps_checks.length; i++) {
            $steps_checks.eq(i).replaceWith(`<input type='checkbox' ${steps_checks_states[i] ? "checked" : ""} class='stepCheck'>`)
        }

        let category_color = $todo.css("border-color")
        $todo.css("box-shadow", "none")
        $todo.css("border", "1px solid #444444")
        $todo.css("border-right", `4px solid ${category_color}`)

        $(state ? "#todosFinished" : "#todosArea").append($todo.prop("outerHTML"))
        $todo.remove()

        let order = $todo_id.map(function () {
            return $(this).text();
        }).get()

        await this.app.services.data_updater('change-checks-goal', {id: id, state: state}, 'PATCH')
        console.log(order)
        if ($('#todosAll').length) await this.app.services.data_updater('goals-reorder', {order: order}, 'PUT')
        this.build_finished_count()
        this.dragula_day_view()
    }
}