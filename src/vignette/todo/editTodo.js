
export class TodoEdit {
    constructor(app) {
        this.initEventListeners()
        this.app = app

        this.selected_goal = null
        this.selected_goal_id = null
    }

    initEventListeners() {
        $(document).on('click', '.todo, .monthTodo, .day .sidebarTask', async (event) => {
            $("#vignette").css('display', 'block')

            await this.get_goal_data($(event.currentTarget))
        })

        $(document).on('click', '#editMainCheck', () => {
            let positions = this.change_edit_check()

            if (!$('#projectContent').length) {
                this.app.todo.todoViews.planViews.dayView.change_main_check(positions[0])
            } else {
                this.app.todo.todoViews.projectView.change_project_check(this.selected_goal)
            }
            this.selected_goal = $('#main .todo').eq(positions[1])
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
        $edit_clone.find('#selectDate').text(this.app.settings.date.change_to_edit_format(goal['addDate']))

        this.app.vignette.todoVignette.set_category(goal['category'], $edit_clone)
        this.app.vignette.todoVignette.set_project(goal['pr_id'], $edit_clone)

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
            let check_state = ""

            if (steps[i]['step_check']) check_state = "checked"
            $('#editSteps2').append()
            steps_formatted += `
            <div class="editStep2">
                <img src="../src/images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
                <input type="checkbox" class="editStepCheck" ${check_state}>
                <textarea rows="1" class="editStepEntry" spellcheck="false">${this.app.settings.data.decode_text(steps[i]['step_text'])}</textarea>
                <div class="editStepId">${steps[i]['id']}</div>
            </div>`
        }
        return steps_formatted
    }

    /**
     * Make changes to the app
     * Saves changes to the database
     */
    async change_goal() {
        let changes = await this.app.vignette.todoVignette.get_goal_settings()
        changes['steps'] = await window.goalsAPI.editGoal({id: this.selected_goal_id, changes: changes})

        if (this.selected_goal.attr('class') === 'todo') {
            this.set_todo_changes(this.selected_goal, changes)
            if (this.selected_goal.closest('#todosAll').length || $('#projectContent').length) {
                this.set_step_changes(this.selected_goal, changes)
                if ($('#todosAll').length) {
                    this.change_project_emblem(changes['pr_id'])
                }
            }
            if ($('#projectContent').length || this.selected_goal.closest('#rightbar').length) {
                let current_project_id = Number($('#projectId').text())
                let new_project_id = Number(changes['pr_id'])
                if (current_project_id !== new_project_id) {
                    this.selected_goal.remove()
                }
            }
        } else if (this.selected_goal.attr('class') === 'monthTodo') {
            this.set_monthTodo_changes(this.selected_goal, changes)
        } else if (this.selected_goal.attr('class') === 'sidebarTask') {
            this.selected_goal.find('.historyText').text(changes['goal'])
        }
    }

    /**
     * Changes visual project emblem in to do
     * @param goal_pos
     * @param project_id id of new selected category
     */
    change_project_emblem(project_id) {
        this.selected_goal.find('.projectEmblem').remove()
        this.selected_goal.append(this.app.settings.data.projects.project_emblem_html(project_id))
    }

    set_todo_changes(selected_goal, changes) {
        selected_goal.find('.task').text(this.app.settings.data.decode_text(changes['goal']))
        if (changes['category'] !== 0) {
            let category_color = this.app.settings.data.categories.categories[changes['category']][0]
            selected_goal.css('border-right', `4px solid ${category_color}`)

        } else {
            selected_goal.css('border', "1px solid #444444")
        }
        selected_goal.find('.check_task').css('border-color', this.app.settings.data.check_border[changes['importance']])

    }

    set_monthTodo_changes(selected_goal, changes) {
        selected_goal.find('.monthTodoText').text(changes['goal'])
        let category_color = "rgb(74, 74, 74)"

        console.log(selected_goal.category)
        if (changes.category !== 0) {
            category_color = this.app.settings.data.categories.categories[changes.category][0]
        }
        selected_goal.find('.monthTodoLabel').css('background-color', category_color)
    }

    set_step_changes(selected_goal, changes) {
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
                console.log($('#main .todo').length)
                new_position = $('#main .todo').length - 1
            }
            else {
                new_position = $('#todosArea .todo').length
            }
        }
        return [position, new_position]
    }
}
