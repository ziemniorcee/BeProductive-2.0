import {TodoNew} from "./newTodo.js";
import {TodoEdit} from "./editTodo.js";
import {TodoProjectNew} from "./newProjectTodo.js";

export class TodoVignette {
    constructor(app) {
        this.initEventListeners()

        this.app = app
        this.prevent_step_blur = false

        this.todo_edit = new TodoEdit(app, this)
        this.todo_new = new TodoNew(app, this)
        this.todo_project_new = new TodoProjectNew(app, this)
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
        $('#editSteps2').append(this.render_step())

        setTimeout(() => {
            let edit_step_entry = $('.editStepEntry');
            edit_step_entry.last().focus();
        }, 0);
    }

    /**
     * Renders step for edit
     * @param check if step is checked
     * @param text step text
     * @param id step id
     * @returns {string} html string
     */
    render_step(check="", text="", id=-1) {
        return `<div class="editStep2">
            <img src="../src/images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
            <input type="checkbox" class="editStepCheck" ${check}>
            <textarea rows="1" class="editStepEntry" spellcheck="false">${text}</textarea>
            <div class="editStepId">${id}</div>
        </div>`
    }


    async get_goal_settings() {
        let edit_main_entry = $('#editMainEntry').val()
        let edit_note_entry = $('#editNoteEntry').val()
        let steps_array = this.get_steps()

        let check_state = $('#editMainCheck').prop('checked')
        let category_id = Number($('.categoryDeciderId').eq(0).text())
        let importance = $('#editImportance').val()

        let date_type = 0
        if ($('#ASAPList').length > 0) date_type = 2
        else if ($('#editLabelDate').text() === "Deadline") {
            date_type = 1
        }

        let new_date = ""
        if ($('#selectDate').text() !== "None"){
            new_date = this.app.settings.date.get_edit_sql_format($('#selectDate').text())
        }
        let project_id = Number($('.projectDeciderId').text())

        return {
            'goal': this.app.settings.data.encode_text(edit_main_entry),
            'check_state': check_state,
            'category': category_id,
            'importance': importance,
            'steps': steps_array,
            'note': this.app.settings.data.encode_text(edit_note_entry),
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
                    'step_text': this.app.settings.data.encode_text(step_input),
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
            const project = this.app.settings.data.projects.projects.find(item => item.id === project_id);
            let icon_path = this.app.settings.data.projects.findProjectPathByName(`project${project_id}`)
            $edit_clone.find('.projectDeciderName').text(project["name"])
            $edit_clone.find('.projectDeciderIcon img').attr('src', `${icon_path}`)
            $edit_clone.find('.projectDeciderIcon img').css('display', 'block')
            $edit_clone.find('.projectDeciderId').text(project_id)
            $edit_clone.find('.projectDecider').css('border', `2px solid ${this.app.settings.data.categories.categories[project['category']][0]}`)
        }
    }

    set_category(category_id, $edit_clone) {
        if (category_id !== 0) {
            $edit_clone.find('.categoryDecider').css('border-color', this.app.settings.data.categories.categories[category_id][0])
            $edit_clone.find('.categoryDeciderName').text(this.app.settings.data.categories.categories[category_id][1])
        } else {
            $edit_clone.find('.categoryDecider').css('border-color', "rgb(74, 74, 74)")
            $edit_clone.find('.categoryDeciderName').text("No category")
        }
        $edit_clone.find('.categoryDeciderId').text(category_id)
    }

    async add_goal_core(){
        let changes = await this.get_goal_settings()
        let new_goal_settings = await window.goalsAPI.newGoal2({changes: changes})
        changes['id'] = new_goal_settings[0]
        changes['check_state'] = 0
        changes['steps'] = this.app.todo.todoComponents.steps._steps_HTML(new_goal_settings[1], changes['category'])
        return changes
    }
}






