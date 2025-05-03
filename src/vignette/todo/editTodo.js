export class TodoEdit {
    constructor(app, todo_vignette) {
        this.initEventListeners()
        this.app = app
        this.vignette = todo_vignette

        this.selected_goal = null
        this.selected_goal_id = null
    }

    initEventListeners() {
        $(document).on('click', '.todo, .monthTodo, .day .sidebarTask', async (event) => {
            $("#vignette").css('display', 'block')

            await this.get_goal_data($(event.currentTarget))
        })

        $(document).on('click', '#editMainCheck', () => {
            if ($('#todosAll').length) {
                let positions = this.change_edit_check()
                this.app.todo.todoViews.planViews.dayView.change_main_check(positions[0])
                this.selected_goal = $('#main .todo').eq(positions[1])
            }
        })
    }

    /**
     * gets data for edited goal
     * @param this_todo selected goal
     */
    async get_goal_data(this_todo) {
        this.selected_goal = this_todo
        let array_option = 0

        if (this.selected_goal.attr('class') === 'todo') {
            this.selected_goal_id = this.selected_goal.find('.todoId').text()
        } else if (this.selected_goal.attr('class') === 'monthTodo') {
            this.selected_goal_id = this.selected_goal.find('.monthTodoId').text()
        }

        if (this.selected_goal.attr('class') === 'sidebarTask') {
            this.selected_goal_id = $('.sidebarTask').index(this_todo)
            array_option = 1
        } else if (this.selected_goal.closest('#rightbar').length) {
            array_option = 2
        }

        let goals = await window.goalsAPI.askEditGoal({todo_id: this.selected_goal_id, option: array_option})
        this.build_edit(goals[0], goals[1])
    }

    /**
     * build edit based on given data
     * @param goal selected goal data
     * @param steps data of steps of selected goal
     */
    build_edit(goal, steps) {
        let $edit_clone = $("<div id='taskEdit' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $edit_clone.append($(edit_main_template).clone())
        const edit_right_template = $('#editRightTemplate').prop('content');
        $edit_clone.find('#editBody').append($(edit_right_template).clone())

        $edit_clone.find('#editMainEntry').val(this.app.settings.data.decode_text(goal["goal"]))
        $edit_clone.find('#editNoteEntry').val(this.app.settings.data.decode_text(goal["note"]))
        $edit_clone.find('#editMainCheck').prop("checked", goal['check_state'])

        if (goal['note'] !== "") $edit_clone.find('#editNoteImg').css('display', 'none')
        $edit_clone.find('#editSteps2').html(this.set_steps(steps))

        $edit_clone.find('#editImportance').val(goal["importance"])
        $edit_clone.find('#editImportance').css('background-color', this.app.settings.data.range2_backgrounds[goal["importance"]])
        if (goal['addDate'] === "") {
            $edit_clone.find('#selectDate').text("None")
        } else {
            $edit_clone.find('#selectDate').text(this.app.settings.date.change_to_edit_format(goal['addDate']))
        }
        this.vignette.set_category(goal['category'], $edit_clone)
        this.vignette.set_project(goal['pr_id'], $edit_clone)

        $("#vignette").append($edit_clone)

        this.dragula_steps()

        $(function () {
            $("#editDatePicker").datepicker({
                dateFormat: "dd.mm.yy",
                onSelect: function (selectedDate) {
                    $('#selectDate').text(selectedDate)
                    $('#editDateSelector').css('display', 'none')
                }
            });
        });
    }


    /**
     * enables drag and drop between steps
     */
    dragula_steps() {
        dragula(Array.from($('#editSteps2')), {
            moves: function (el, container, handle) {
                return handle.classList.contains('editStepDrag');
            }
        })
    }

    /**
     * Setting steps for edit from given data
     * @param steps data of steps, contains text and check_state of step
     */
    set_steps(steps) {
        let steps_formatted = ""
        for (let i = 0; i < steps.length; i++) {
            let check = ""
            let text = this.app.settings.data.decode_text(steps[i]['step_text'])
            if (steps[i]['step_check']) check = "checked"

            steps_formatted += this.vignette.render_step(check, text, steps[i]['id'])
        }
        return steps_formatted
    }

    /**
     * Make changes to the app
     * Saves changes to the database
     */
    async change_goal() {
        let changes = await this.vignette.get_goal_settings()
        changes['steps'] = await window.goalsAPI.editGoal({id: this.selected_goal_id, changes: changes})

        if ($('#todosAll').length) {
            this.day_todo_change(changes)

        } else if ($('#ASAPList').length) {
            this.asap_todo_change(changes)
        } else if ($('.weekDay').length) {
            this.week_todo_change(changes)
        } else if ($('.monthTodo').length) {
            this.month_todo_change(changes)
        } else if ($('#projectContent').length) {
            this.project_todo_change(changes)
        }
    }


    /**
     * changes standard goal in day view and asap view
     * @param changes changes of goal
     */
    day_todo_change(changes) {
        if (changes['addDate'] === this.app.settings.date.day_sql) {
            this._set_todo_changes(this.selected_goal, changes)
            this._change_project_emblem(changes['pr_id'])
            this._set_step_changes(this.selected_goal, changes)
        } else {
            this.selected_goal.remove()
        }
        this.app.todo.todoViews.planViews.dayView.dragula_day_view()
    }

    asap_todo_change(changes) {
        if (changes['check_state'] === true) {
            this.selected_goal.remove()
        } else {
            this._set_todo_changes(this.selected_goal, changes)
            this._change_project_emblem(changes['pr_id'])
            this._set_step_changes(this.selected_goal, changes)
        }
    }

    /**
     * changes week day goal
     * @param changes changes of goal
     */
    week_todo_change(changes) {
        if (changes['check_state'] === true) {
            this.selected_goal.remove()
        } else {
            let previous_day = this.selected_goal.closest('.weekDay').find('.weekDayText').text()
            let previous_date_id = this.app.settings.data.weekdays2.indexOf(previous_day)
            let previous_date = this.app.settings.date.week_current[previous_date_id]

            if (this.app.settings.date.week_current.includes(changes['addDate'])) {
                if (changes['addDate'] !== previous_date) {
                    this.selected_goal.remove()
                    let new_date_id = this.app.settings.date.week_current.indexOf(changes['addDate'])
                    let new_date_day = this.app.settings.data.weekdays2[new_date_id]
                    let new_date = this.app.settings.data.weekdays_grid.flat().indexOf(new_date_day)

                    $('.weekDayGoals').eq(new_date).prepend(this.selected_goal)
                }
                this._set_todo_changes(this.selected_goal, changes)
            } else {
                this.selected_goal.remove()
            }
        }
        this.app.todo.todoViews.planViews.weekView.dragula_week_view()
    }

    month_todo_change(changes) {
        if (changes['check_state'] === true) {
            this.selected_goal.remove()
        } else {
            let previous_day = Number(this.selected_goal.closest('.monthDay').find('.monthDate').text())
            let month_array = this.app.settings.date.get_month_array()
            let previous_date = month_array[previous_day - 1]

            if (month_array.includes(changes['addDate'])) {
                if (changes['addDate'] !== previous_date) {
                    this.selected_goal.remove()
                    let new_date_day = month_array.indexOf(changes['addDate']) + 1
                    let new_date = $('.monthDate').filter(function () {
                        return Number($(this).text()) === new_date_day;
                    }).toArray()[0]
                    $(new_date).closest('.monthDay').find('.monthGoals').prepend(this.selected_goal)
                }
                this._set_monthTodo_changes(this.selected_goal, changes)
            } else {
                this.selected_goal.remove()
            }
        }
        this.app.todo.todoViews.planViews.monthView.dragula_month_view()
    }

    project_todo_change(changes){
        if (changes['project_id'] !== this.selected_goal.find('.projectDeciderId').text()) {
            this.selected_goal.remove()
        } else {
            let is_todo_checked = changes['check_state']

            let is_from_todo = this.selected_goal.closest('#projectTodo').length
            let is_from_doing = this.selected_goal.closest('#projectDoing').length
            let is_from_done = this.selected_goal.closest('#projectDone').length
            if (is_todo_checked && (is_from_todo || is_from_doing)) {
                this.selected_goal.remove()
                $('#projectDone').find('.projectSectionGoals').append(this.selected_goal)
            } else if (!is_todo_checked && is_from_done) {
                this.selected_goal.remove()
                $('#projectTodo').find('.projectSectionGoals').append(this.selected_goal)
            }

            let importance_color = this.selected_goal.find('.check_task').css("border-color")
            this.selected_goal.find('.check_task').replaceWith(`<input type='checkbox' ${is_todo_checked ? "checked" : ""} class='check_task' style="border-color:${importance_color}">`)
            this._set_todo_changes(this.selected_goal, changes)
            this._set_step_changes(this.selected_goal, changes)
        }
    }

    /**
     * Changes visual project emblem in to do
     * @param goal_pos
     * @param project_id id of new selected category
     */
    _change_project_emblem(project_id) {
        this.selected_goal.find('.projectEmblem').remove()
        this.selected_goal.append(this.app.settings.data.projects.project_emblem_html(project_id))
    }

    _set_todo_changes(selected_goal, changes) {
        selected_goal.find('.task').text(this.app.settings.data.decode_text(changes['goal']))
        if (changes['category'] !== 0) {
            let category_color = this.app.settings.data.categories.categories[changes['category']][0]
            selected_goal.css('border-right', `4px solid ${category_color}`)

        } else {
            selected_goal.css('border', "1px solid #444444")
        }
        selected_goal.find('.check_task').css('border-color', this.app.settings.data.check_border[changes['importance']])
    }

    _set_monthTodo_changes(selected_goal, changes) {
        selected_goal.find('.monthTodoText').text(changes['goal'])
        let category_color = "rgb(74, 74, 74)"

        if (changes.category !== 0) {
            category_color = this.app.settings.data.categories.categories[changes.category][0]
        }
        selected_goal.find('.monthTodoLabel').css('background-color', category_color)
    }

    _set_step_changes(selected_goal, changes) {
        selected_goal.find('.stepsShow').remove()
        selected_goal.find('.steps').remove()
        selected_goal.find('.taskText').append(this.app.todo.todoComponents.steps._steps_HTML(changes['steps'], changes['category']))
    }

    change_edit_check() {
        let check_state = $('#editMainCheck').prop('checked')
        this.selected_goal.find('.check_task').prop('checked', check_state)
        let position = $('#main .todo').index(this.selected_goal)

        let new_position = 0
        if (!$('#projectContent').length) {
            if (check_state) {
                new_position = $('#main .todo').length - 1
            } else {
                new_position = $('#todosArea .todo').length
            }
        }
        return [position, new_position]
    }
}
