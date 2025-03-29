import {check_border, decode_text, encode_text, range2_backgrounds} from "./data.mjs";

export class TodoVignette {
    constructor(app_data, app_date, app_steps, dayView, app_project) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date
        this.steps = app_steps
        this.dayView = dayView
        this.project = app_project
        this.prevent_step_blur = false

        this.todo_edit = new TodoEdit(this)
        this.todo_new = new TodoNew(this)
        this.todo_project_new = new TodoProjectNew(this)
    }

    initEventListeners() {
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
            this.step_tab_event(event)
        })

        $(document).on('blur', '.editStepEntry', (event) => {
            if (!this.prevent_step_blur) {
                this.change_step(event.currentTarget)
            }

            this.prevent_step_blur = false
        })

        $(document).on('click', '#taskEdit, #newTask', (event) => {
            this.hide_deciders(event)
        })

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
        if (note_content === "") {
            $('#editNoteImg').css('display', 'block')
        } else {
            $('#editNoteImg').css('display', 'none')
        }
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
    }

    async get_goal_settings() {
        let edit_main_entry = $('#editMainEntry').val()
        let edit_note_entry = $('#editNoteEntry').val()
        let steps_array = this.get_steps()

        let category_id = Number($('.categoryDeciderId').text())
        let importance = $('#editImportance').val()

        let date_type = 0
        if ($('#ASAPList').length > 0) date_type = 2
        else if ($('#editLabelDate').text() === "Deadline") {
            date_type = 1
        }

        let new_date = ""
        if ($('#selectDate').text() !== "None"){
            new_date = this.date.get_edit_sql_format($('#selectDate').text())
        }
        let project_id = Number($('.projectDeciderId').text())

        return {
            'goal': encode_text(edit_main_entry),
            'category': category_id,
            'importance': importance,
            'steps': steps_array,
            'note': encode_text(edit_note_entry),
            'pr_id': project_id,
            'date_type': date_type,
            'addDate': new_date
        }
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

    hide_deciders(event){
        if (!$(event.target).closest('.projectDecider').length && !$(event.target).closest('.projectDeciderSelect').length) {
            $(".projectDeciderSelect").remove()
        }

        if (!$(event.target).closest('.categoryDecider').length && !$(event.target).closest('.categoryDeciderSelect').length) {
            $(".categoryDeciderSelect").remove()
        }

        if (!$(event.target).closest('.dateDecider').length && !$(event.target).closest('.dateDeciderSelect').length) {
            $(".dateDeciderSelect").css('display', 'none')
        }
    }

    step_tab_event(){
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
    }

    /**
     * sets project setting of selected goal based on selected option
     * @param project_id id of selected option
     */
    set_project(project_id, $edit_clone) {
        if (project_id !== -1 && project_id !== null) {
            const project = this.data.projects.find(item => item.id === project_id);
            let icon_path = this.data.findProjectPathByName(`project${project_id}`)
            $edit_clone.find('.projectDeciderName').text(project["name"])
            $edit_clone.find('.projectDeciderIcon img').attr('src', `${icon_path}`)
            $edit_clone.find('.projectDeciderIcon img').css('display', 'block')
            $edit_clone.find('.projectDeciderId').text(project_id)
            $edit_clone.find('.projectDecider').css('border', `2px solid ${this.data.categories[project['category']][0]}`)
        }
    }

    set_category(category_id, $edit_clone) {
        if (category_id !== 0) {
            $edit_clone.find('.categoryDecider').css('border-color', this.data.categories[category_id][0])
            $edit_clone.find('.categoryDeciderName').text(this.data.categories[category_id][1])
        } else {
            $edit_clone.find('.categoryDecider').css('border-color', "rgb(74, 74, 74)")
            $edit_clone.find('.categoryDeciderName').text("No category")
        }
        $edit_clone.find('.categoryDeciderId').text(category_id)
    }
}



export class TodoNew {
    constructor(app_vignette) {
        this.initEventListeners()
        this.vignette = app_vignette
    }

    initEventListeners(){
        $(document).on('click', '#todosAddNew', (event) => {
            this.build_adder()
        })
    }

    build_adder(){
        $("#vignette").css('display', 'block')
        let $edit_clone = $("<div id='newTask' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $edit_clone.append($(edit_main_template).clone())
        const edit_right_template = $('#editRightTemplate').prop('content');
        $edit_clone.find('#editBody').append($(edit_right_template).clone())
        $edit_clone.find('#selectDate').text(this.vignette.date.change_to_edit_format(this.vignette.date.day_sql))
        $("#vignette").append($edit_clone)

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

    async add_goal(){
        let changes = await this.vignette.get_goal_settings()
        changes['goal_pos'] = ('#todosArea .todo').length + 1
        let new_goal_settings = await window.goalsAPI.newGoal2({changes: changes})
        changes['id'] = new_goal_settings[0]
        changes['check_state'] = 0
        changes['steps'] = this.vignette.steps._steps_HTML(new_goal_settings[1], changes['category'])
        console.log(changes['addDate'])
        if (changes['addDate'] === this.vignette.date.day_sql) {
            $('#todosArea').append(this.vignette.dayView.build_goal(changes))

        }
    }
}

export class TodoProjectNew {
    constructor(app_vignette) {
        this.initEventListeners()
        this.vignette = app_vignette
    }

    initEventListeners(){
        $(document).on('click', '#projectNewGoal', () => {
            this.build_adder()
        })
    }

    build_adder(){
        $("#vignette").css('display', 'block')
        let $edit_clone = $("<div id='newProjectTask' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $edit_clone.append($(edit_main_template).clone())
        const edit_right_template = $('#editRightTemplate').prop('content');
        $edit_clone.find('#editBody').append($(edit_right_template).clone())
        $edit_clone.find('#selectDate').text("None")

        let project_id = Number($('#projectId').text())
        console.log(this.vignette.data.projects)
        let category_id = this.vignette.data.projects.find(project => project.id === project_id)['category']
        this.vignette.set_category(category_id, $edit_clone)
        this.vignette.set_project(project_id, $edit_clone)
        $("#vignette").append($edit_clone)


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

    async add_goal(){
        let changes = await this.vignette.get_goal_settings()
        changes['goal_pos'] = ('#todosArea .todo').length + 1
        let new_goal_settings = await window.goalsAPI.newGoal2({changes: changes})
        changes['id'] = new_goal_settings[0]
        changes['check_state'] = 0
        changes['steps'] = this.vignette.steps._steps_HTML(new_goal_settings[1], changes['category'])
        console.log($('#projectTodo').find('.projectSectionGoals').length)
        $('#projectTodo').find('.projectSectionGoals').append(this.vignette.project.build_project_goal(changes))
    }
}

export class TodoEdit {
    constructor(app_vignette) {
        this.initEventListeners()
        this.vignette = app_vignette

        this.selected_goal = null
        this.selected_goal_id = null
    }

    initEventListeners() {
        $(document).on('click', '.todo, .monthTodo, .day .sidebarTask', async (event) => {
            $("#vignette").css('display', 'block')

            await this.get_goal_data($(event.currentTarget))

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
        $edit_clone.find('#editSteps2').html(this.set_steps(steps))




        $edit_clone.find('#editImportance').val(goal["importance"])
        $edit_clone.find('#editImportance').css('background-color', range2_backgrounds[goal["importance"]])
        $edit_clone.find('#selectDate').text(this.vignette.date.change_to_edit_format(goal['addDate']))

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
            let check_state = ""

            if (steps[i]['step_check']) check_state = "checked"
            $('#editSteps2').append()
            steps_formatted += `
            <div class="editStep2">
                <img src="images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
                <input type="checkbox" class="editStepCheck" ${check_state}>
                <textarea rows="1" class="editStepEntry" spellcheck="false">${decode_text(steps[i]['step_text'])}</textarea>
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
        let changes = await this.vignette.get_goal_settings()
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
        this.selected_goal.append(this.vignette.data.project_emblem_html(project_id))
    }

    set_todo_changes(selected_goal, changes) {
        selected_goal.find('.task').text(decode_text(changes['goal']))
        if (changes['category'] !== 0) {
            let category_color = this.vignette.data.categories[changes['category']][0]
            selected_goal.css('border-right', `4px solid ${category_color}`)

        } else {
            selected_goal.css('border', "1px solid #444444")
        }
        selected_goal.find('.check_task').css('border-color', check_border[changes['importance']])

    }

    set_monthTodo_changes(selected_goal, changes) {
        selected_goal.find('.monthTodoText').text(changes['goal'])
        let category_color = "rgb(74, 74, 74)"

        console.log(selected_goal.category)
        if (changes.category !== 0) {
            category_color = this.vignette.data.categories[changes.category][0]
        }
        selected_goal.find('.monthTodoLabel').css('background-color', category_color)
    }

    set_step_changes(selected_goal, changes) {
        selected_goal.find('.stepsShow').remove()
        selected_goal.find('.steps').remove()
        selected_goal.find('.taskText').append(this.vignette.steps._steps_HTML(changes['steps'], changes['category']))
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


