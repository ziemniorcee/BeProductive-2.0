import {
    check_border, decode_text, encode_text,
    getIdByColor,
    range1_backgrounds,
    range2_backgrounds
} from "./data.mjs";


export class Edit {
    constructor(app_data, app_date, app_categories, app_steps) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date
        this.categories = app_categories
        this.steps = app_steps

        this.selected_goal = null
        this.selected_goal_id = null
        this.selected_project_id = null

        this.prevent_step_blur = false
    }

    initEventListeners() {
        $(document).on('click', '.todo, .weekDay .todo, .monthTodo, .day .sidebarTask', async (event) => {
            $("#vignette").css('display', 'block')
            $("#taskEdit").css('display', 'block')

            await this.get_goal_data($(event.currentTarget))
        })

        $(document).on('input', '#editMainEntry, #editNoteEntry, .editStepEntry', (event) => {
            this.fix_entry($(event.currentTarget))
        })

        $(document).on('input', '#editNoteEntry', () => {
            let note_content = $('#editNoteEntry').val()
            this.set_note(note_content)
        })

        $(document).on('click', '#editNewStep', () => {
            this.new_step_add()
        })

        $(document).on('keydown', '.editStepEntry', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault()
                this.prevent_step_blur = true

                let is_last = $(event.currentTarget).is('.editStepEntry:last')
                let is_current_empty = $(event.currentTarget).val() === ""

                if (is_last && !is_current_empty) {
                    this.new_step_add()
                } else {
                    let $edit_step_entry = $('.editStepEntry')
                    let current_input_id = $edit_step_entry.index(event.currentTarget)

                    setTimeout(() => {
                        $edit_step_entry.eq(current_input_id + 1).focus();
                    }, 0);
                }
            }
        })

        $(document).on('blur', '.editStepEntry', (event) => {
            if (!this.prevent_step_blur) {
                this.change_step(event.currentTarget)
            }

            this.prevent_step_blur = false
        })

        $(document).on('click', '.editPickProject', (event) => {
            this.change_project(event.currentTarget)
        })

        $(document).on('click', '#selectDate', () => {
            let $edit_date_selector = $('#editDateSelector')
            let is_visible = $edit_date_selector.css('display') === "flex"
            if (is_visible) $edit_date_selector.css('display', 'none')
            else $edit_date_selector.css('display', 'flex')
        })

        $(document).on('click', '#editDateToday', () => {
            let date_formatted = this.date.get_edit_date_format(this.date.today)
            $('#selectDate').text(date_formatted)
        })

        $(document).on('click', '#editDateTomorrow', () => {
            let date_formatted = this.date.get_edit_date_format(this.date.tomorrow)
            $('#selectDate').text(date_formatted)
        })

        $('.vignetteLayer').on('click', function (e) {
            let $edit_date_selector = $('#editDateSelector')
            let $select_date = $('#selectDate')

            if (!$edit_date_selector.is(e.target) && !$select_date.is(e.target)) {
                $edit_date_selector.css('display', 'none'); // Close the picker
            }
        });

        $(document).on('click', '#editSwitchDateMode', () => {
            let $edit_label_date = $('#editLabelDate')
            let $edit_switch_date_mode = $('#editSwitchDateMode')
            let $edit_switch_img = $('#editSwitchImg')

            let is_current_date = $edit_label_date.text() === 'Date'

            if (is_current_date) {
                $edit_label_date.text('Deadline')
                $edit_switch_date_mode.css('background-color', 'blue')
                $edit_switch_img.attr('src', 'images/goals/dashboard/other.png')
            } else {
                $edit_label_date.text('Date')
                $edit_switch_date_mode.css('background-color', 'red')
                $edit_switch_img.attr('src', 'images/goals/deadline.png')
            }
        })

        $(document).on('mouseenter', '#editSwitchDateMode', () => {
            let $edit_switch_date_mode = $('#editSwitchDateMode')

            let is_current_date = $('#editLabelDate').text() === 'Date'
            if (is_current_date) {
                $edit_switch_date_mode.css('background-color', 'red')
            } else {
                $edit_switch_date_mode.css('background-color', 'blue')
            }
        })

        $(document).on('mouseleave', '#editSwitchDateMode', () => {
            $('#editSwitchDateMode').css('background-color', '')
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

        $edit_clone.find('#editMainEntry').val(decode_text(goal["goal"]))
        $edit_clone.find('#editNoteEntry').val(decode_text(goal["note"]))
        $edit_clone.find('#editMainCheck').prop("checked", goal['check_state'])

        if (goal['note'] !== "") $edit_clone.find('#editNoteImg').css('display', 'none')
        console.log($edit_clone.find('#editNoteImg'))
        $edit_clone.find('#editSteps2').html(this.set_steps(steps))

        $edit_clone.find('#selectCategory22').css('background-color', this.data.categories[goal["category"]][0])
        $edit_clone.find('#selectCategory22').text(this.data.categories[goal["category"]][1])

        $edit_clone.find('#editDiff').val(goal["difficulty"])
        $edit_clone.find('#editDiff').css('background-color', range1_backgrounds[goal["difficulty"]])

        $edit_clone.find('#editImportance').val(goal["importance"])
        $edit_clone.find('#editImportance').css('background-color', range2_backgrounds[goal["importance"]])
        $edit_clone.find('#selectDate').text(this.date.change_to_edit_format(goal['addDate']))
        this.selected_project_id = goal['pr_pos']
        $("#vignette").append($edit_clone)
        $('#categoryPicker22').html(this.categories._categories_HTML())
        $('#editProjectPicker').html(this._project_picker_HTML())
        this.set_project(goal['pr_pos'])
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
     * Fixes height of textarea so all the text is displayed wrapped
     * @param entry_type one of possible entries in edit main/note/step
     */
    fix_entry(entry_type) {
        entry_type.css('height', 'auto')
        entry_type.css('height', `${entry_type.prop('scrollHeight') - 4}px`)
    }

    /**
     * If there is text in a note it adds icon of note at the beggining of note entry
     */
    set_note(note_content) {
        console.log(note_content === "")
        if (note_content === "") {
            $('#editNoteImg').css('display', 'block')
        } else {
            $('#editNoteImg').css('display', 'none')
        }
    }

    /**
     * sets project setting of selected goal based on selected option
     * @param project_id id of selected option
     */
    set_project(project_id) {
        if (project_id !== -1) {
            let icon_path = this.data.findPathByName(this.data.projects[project_id].icon)
            $('#editSelectProject').css('background-color', this.data.categories[this.data.projects[project_id]['category']][0])
            $('#editSelectProject .editProjectIcon').css('background-color', this.data.categories[this.data.projects[project_id]['category']][0])
            $('#editSelectProject .editProjectName').text(this.data.projects[project_id]["name"])
            $('#editSelectProject .editPickProjectIcon').attr('src', `${icon_path}`)
        } else {
            $('#editSelectProject .editProjectName').eq(0).text('None')
            $('#editSelectProject').css('background-color', "#FF5D00")
            $('#editSelectProject .editProjectIcon').css("backgroundColor", "#D8E1E7")
        }
    }

    /**
     * creates picker based on existing projects
     * @returns {string} HTML of project picker
     */
    _project_picker_HTML() {
        let picks_HTML = `
        <div class="editPickProject">
            <div class="editProjectIcon"></div>
            <div class="editProjectName">None</div>
        </div>`

        for (let i = 0; i < this.data.projects.length; i++) {
            let icon_color = this.data.categories[this.data.projects[i]['category']][0]
            let icon_path = this.data.findPathByName(this.data.projects[i].icon)
            picks_HTML += `
            <div class="editPickProject">
                <div class="editProjectIcon" style="background-color: ${icon_color}">
                    <img class="editPickProjectIcon" alt="" src="${icon_path}">
                </div>
                <div class="editProjectName">${this.data.projects[i]["name"]}</div>
            </div>`
        }
        return picks_HTML
    }

    /**
     * builds new step entry to the steps and focuses on the new entyr
     */
    new_step_add() {
        $('#editNewStep').toggle()
        $('#editSteps2').append(`
        <div class="editStep2">
            <img src="images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
            <input type="checkbox" class="editStepCheck">
            <textarea rows="1" class="editStepEntry" spellcheck="false"></textarea>
        </div>`)

        setTimeout(() => {
            let edit_step_entry = $('.editStepEntry');
            edit_step_entry.last().focus();
        }, 0);
        console.log('CHuj224')


    }


    /**
     * changes step based on entry
     * if its empty it removes entire step
     * if it's a new step it displays new step button
     * @param selected_step picked step entry event
     */
    change_step(selected_step) {
        let edit_step_entry = $('.editStepEntry')

        let is_last_step = selected_step === edit_step_entry.last()[0]
        let is_new_step_hidden = $('#editNewStep').css('display') === "none"

        if (is_last_step && is_new_step_hidden) $('#editNewStep').toggle()

        if ($(selected_step).val() === "") {
            $(selected_step).closest('.editStep2').remove()
        }
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
                <img src="images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
                <input type="checkbox" class="editStepCheck" ${check_state}>
                <textarea rows="1" class="editStepEntry" spellcheck="false">${decode_text(steps[i]['step_text'])}</textarea>
            </div>`
        }
        return steps_formatted
    }

    /**
     * changes selected project in picker
     * @param picked_project id of selected project
     */
    change_project(picked_project) {
        this.selected_project_id = $('.editPickProject').index(picked_project) - 1
        this.set_project(this.selected_project_id)
        $('#editProjectPicker').toggle()
    }

    /**
     * Make changes to the app
     * Saves changes to the database
     */
    change_goal(project_pos) {
        let edit_main_entry = $('#editMainEntry').val()
        let edit_note_entry = $('#editNoteEntry').val()
        let category_color = $('#selectCategory22').css('background-color')
        let category_id = getIdByColor(this.data.categories, category_color)
        let difficulty = $('#editDiff').val()
        let importance = $('#editImportance').val()
        let steps_array = this.get_steps()
        let date_type = $('#editLabelDate').text() === "Deadline"
        let new_date = this.date.get_edit_sql_format($('#selectDate').text())

        let changes = {
            'goal': encode_text(edit_main_entry),
            'category': category_id,
            'difficulty': difficulty,
            'importance': importance,
            'steps': steps_array,
            'note': encode_text(edit_note_entry),
            'project_id': this.selected_project_id,
            'date_type': date_type,
            'addDate': new_date
        }

        if (this.selected_goal.attr('class') === 'todo') {
            this.set_todo_changes(this.selected_goal, changes)
            if (this.selected_goal.closest('#todosAll').length || $('#projectContent').length) {
                this.set_step_changes(this.selected_goal, changes)
                if ($('#todosAll').length) {
                    this.change_project_emblem(this.selected_project_id)
                }
            }
            if ($('#projectContent').length || this.selected_goal.closest('#rightbar').length) {
                if (project_pos !== this.selected_project_id) {
                    this.selected_goal.remove()
                }
            }
        } else if (this.selected_goal.attr('class') === 'monthTodo') {
            this.set_monthTodo_changes(this.selected_goal, changes)
        } else if (this.selected_goal.attr('class') === 'sidebarTask') {
            this.selected_goal.find('.historyText').text(changes['goal'])
        }

        window.goalsAPI.editGoal({id: this.selected_goal_id, changes: changes})
    }

    /**
     * Changes visual project emblem in to do
     * @param goal_pos
     * @param project_id id of new selected category
     */
    change_project_emblem(project_id) {
        this.selected_goal.find('.projectEmblem').remove()
        this.selected_goal.append(this.data.project_emblem_html(project_id))
    }

    set_todo_changes(selected_goal, changes) {
        selected_goal.find('.task').text(decode_text(changes['goal']))
        selected_goal.find('.todoCheck').css('background-color', this.data.categories[changes['category']][0])
        let url = `images/goals/rank${changes['difficulty']}.svg`
        selected_goal.find('.todoCheck').css('background-image', `url("${url}")`)
        selected_goal.find('.checkDot').css('border-color', check_border[changes['importance']])
    }

    set_monthTodo_changes(selected_goal, changes) {
        selected_goal.find('.monthTodoText').text(changes['goal'])
        selected_goal.find('.monthTodoLabel').css('background-color', this.data.categories[changes['category']][0])
        selected_goal.css('background-color', this.data.categories2[changes['category']])
    }

    set_step_changes(selected_goal, changes) {
        selected_goal.find('.stepsShow').remove()
        selected_goal.find('.steps').remove()
        selected_goal.find('.taskText').append(this.steps._steps_HTML(changes['steps'], changes['category']))
    }

    get_steps() {
        let edit_steps = $('.editStepEntry')
        let edit_checks = $('.editStepCheck')

        let steps_array = []
        for (let i = 0; i < edit_steps.length; i++) {
            let step_input = edit_steps.eq(i).val()
            if (step_input !== "") {
                steps_array.push({
                    'step_text': encode_text(step_input),
                    'step_check': Number(edit_checks.eq(i).prop('checked'))
                })
            }
        }
        return steps_array
    }


    change_edit_check() {
        let check_state = $('#editMainCheck').prop('checked')
        this.selected_goal.find('.check_task').prop('checked', check_state)
        let position = $('#main .todo').index(this.selected_goal)

        if (!$('#projectContent').length) {
            if (check_state) position = $('#main .todo').length - 1
            else {
                position = $('#todosArea .todo').length
            }
        }
        return position
    }
}





