import {_categories_HTML, _steps_HTML, change_main_check, dragula_day_view} from "./render.mjs";
import {
    categories,
    categories2,
    check_border,
    getIdByColor,
    projects,
    range1_backgrounds,
    range2_backgrounds
} from "./data.mjs";
import {_project_picker_HTML, change_project_check, project_emblem_html, project_pos} from "./project.mjs";

let selected_goal = null
let selected_goal_id = null
let selected_project_id = null

export function set_edit() {
    $('#categoryPicker22').html(_categories_HTML())
    $('#editProjectPicker').html(_project_picker_HTML())
}

edit_launch()

function edit_launch() {
    is_note_img()
    dragula_steps()
}

$(document).on('click', '.todo, .weekDay .todo, .monthTodo, .day .sidebarTask', function () {
    $("#vignette").css('display', 'block')
    $("#taskEdit").css('display', 'block')

    get_goal_data($(this))
})

$(document).on('click', '#vignette', () => {
    change_goal()
    dragula_day_view()
})

$(document).on('input', '#editMainEntry, #editNoteEntry, .editStepEntry', function () {
    fix_entry($(this))
})

/**
 * Fixes height of textarea so all the text is displayed wrapped
 * @param entry_type one of possible entries in edit main/note/step
 */
function fix_entry(entry_type) {
    entry_type.css('height', 'auto')
    entry_type.css('height', `${entry_type.prop('scrollHeight') - 4}px`)
}

$(document).on('input', '#editNoteEntry', () => {
    is_note_img()
})

/**
 * If there is text in a note it adds icon of note at the beggining of note entry
 */
function is_note_img() {
    let note_content = $('#editNoteEntry').val()

    if (note_content === "") {
        $('#editNoteImg').css('display', 'block')
    } else {
        $('#editNoteImg').css('display', 'none')
    }
}

$(document).on('click', '#editNewStep', () => {
    new_step_add()
})

/**
 * builds new step entry to the steps and focuses on the new entyr
 */
function new_step_add() {
    $('#editNewStep').toggle()
    $('#editSteps2').append(`
        <div class="editStep2">
            <img src="images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
            <input type="checkbox" class="editStepCheck">
            <textarea rows="1" class="editStepEntry" spellcheck="false"></textarea>
        </div>`)

    let edit_step_entry = $('.editStepEntry')
    edit_step_entry.last().focus()
}

$(document).on('blur', '.editStepEntry', function () {
    change_step(this)
})


/**
 * changes step based on entry
 * if its empty it removes entire step
 * if it's a new step it displays new step button
 * @param selected_step picked step entry event
 */
function change_step(selected_step) {
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
function dragula_steps() {
    dragula(Array.from($('#editSteps2')), {
        moves: function (el, container, handle) {
            return handle.classList.contains('editStepDrag');
        }
    })
}


/**
 * gets data for edited goal
 * @param this_todo selected goal
 */
function get_goal_data(this_todo) {
    selected_goal = this_todo
    let array_option = 0

    if (selected_goal.attr('class') === 'todo') {
        selected_goal_id = selected_goal.find('.todoId').text()
    } else if (selected_goal.attr('class') === 'monthTodo') {
        selected_goal_id = selected_goal.find('.monthTodoId').text()
    }

    if (selected_goal.attr('class') === 'sidebarTask') {
        selected_goal_id = $('.sidebarTask').index(this_todo)
        array_option = 1
    } else if (selected_goal.closest('#rightbar').length){
        array_option = 2
    }


    window.goalsAPI.askEditGoal({todo_id: selected_goal_id, option: array_option})
}

window.goalsAPI.getEditGoal((goal, steps) => {
    build_edit(goal, steps)
})

/**
 * build edit based on given data
 * @param goal selected goal data
 * @param steps data of steps of selected goal
 */
function build_edit(goal, steps) {
    $('#editMainEntry').val(goal["goal"])
    $('#editNoteEntry').val(goal["note"])
    $('#editMainCheck').prop("checked", goal['check_state'])
    is_note_img()
    set_steps(steps)

    $('#selectCategory22').css('background-color', categories[goal["category"]][0])
    $('#selectCategory22').text(categories[goal["category"]][1])

    $('#editDiff').val(goal["difficulty"])
    $('#editDiff').css('background-color', range1_backgrounds[goal["difficulty"]])

    $('#editImportance').val(goal["importance"])
    $('#editImportance').css('background-color', range2_backgrounds[goal["importance"]])

    selected_project_id = goal['pr_pos']
    set_project(goal['pr_pos'])

}

/**
 * Setting steps for edit from given data
 * @param steps data of steps, contains text and check_state of step
 */
function set_steps(steps) {
    $('.editStep2').remove()
    for (let i = 0; i < steps.length; i++) {
        let check_state = ""

        if (steps[i]['step_check']) check_state = "checked"
        $('#editSteps2').append(`
        <div class="editStep2">
            <img src="images/goals/drag.png" class="editStepDrag" draggable="false" alt="">
            <input type="checkbox" class="editStepCheck" ${check_state}>
            <textarea rows="1" class="editStepEntry" spellcheck="false">${steps[i]['step_text']}</textarea>
        </div>`)
    }
}

$(document).on('click', '.editPickProject', function () {
    change_project(this)
})

/**
 * changes selected project in picker
 * @param picked_project id of selected project
 */
function change_project(picked_project) {
    selected_project_id = $('.editPickProject').index(picked_project) - 1

    set_project(selected_project_id)
    $('#editProjectPicker').toggle()

}

/**
 * sets project setting of selected goal based on selected option
 * @param project_id id of selected option
 */
function set_project(project_id) {
    if (project_id !== -1) {
        $('#editSelectProject').css('background-color', categories[projects[project_id]['category']][0])
        $('#editSelectProject .editProjectIcon').css('background-color', categories[projects[project_id]['category']][0])
        $('#editSelectProject .editProjectName').text(categories[projects[project_id]['category']][1])
        $('#editSelectProject .editPickProjectIcon').attr('src', `images/goals/projects/${projects[project_id]["icon"]}.png`)
    } else {
        $('#editSelectProject .editProjectName').eq(0).text('None')
        $('#editSelectProject').css('background-color', "#FF5D00")
        $('#editSelectProject .editProjectIcon').css("backgroundColor", "#D8E1E7")
    }
}

/**
 * Changes visual project emblem in to do
 * @param goal_pos
 * @param project_id id of new selected category
 */
function change_project_emblem(project_id) {
    selected_goal.find('.projectEmblem').remove()
    selected_goal.append(project_emblem_html(project_id))
}


/**
 * Make changes to the app
 * Saves changes to the database
 */
function change_goal() {
    let edit_main_entry = $('#editMainEntry').val()
    let edit_note_entry = $('#editNoteEntry').val()
    let category_color = $('#selectCategory22').css('background-color')
    let category_id = getIdByColor(categories, category_color)
    let difficulty = $('#editDiff').val()
    let importance = $('#editImportance').val()
    let steps_array = get_steps()

    let changes = {
        'goal': edit_main_entry,
        'category': category_id,
        'difficulty': difficulty,
        'importance': importance,
        'steps': steps_array,
        'note': edit_note_entry,
        'project_id': selected_project_id + 1
    }

    if (selected_goal.attr('class') === 'todo') {
        set_todo_changes(selected_goal, changes)
        if (selected_goal.closest('#todosAll').length || $('#projectContent').length) {
            set_step_changes(selected_goal, changes)
            if ($('#todosAll').length) {
                change_project_emblem(selected_project_id)
            }
        }
        if ($('#projectContent').length || selected_goal.closest('#rightbar').length){
            if (project_pos !== selected_project_id) {
                selected_goal.remove()
            }
        }
    } else if (selected_goal.attr('class') === 'monthTodo') {
        set_monthTodo_changes(selected_goal, changes)
    } else if (selected_goal.attr('class') === 'sidebarTask'){
        selected_goal.find('.historyText').text(changes['goal'])
    }

    window.goalsAPI.editGoal({id: selected_goal_id, changes: changes})
}

function set_todo_changes(selected_goal, changes) {
    selected_goal.find('.task').text(changes['goal'])
    selected_goal.find('.todoCheck').css('background-color', categories[changes['category']][0])
    let url = `images/goals/rank${changes['difficulty']}.svg`
    selected_goal.find('.todoCheck').css('background-image', `url("${url}")`)
    selected_goal.find('.checkDot').css('border-color', check_border[changes['importance']])
}

function set_monthTodo_changes(selected_goal, changes){
    selected_goal.find('.monthTodoText').text(changes['goal'])
    selected_goal.find('.monthTodoLabel').css('background-color', categories[category_id][0])
    selected_goal.css('background-color', categories2[category_id])
}

function set_step_changes(selected_goal, changes) {
    selected_goal.find('.stepsShow').remove()
    selected_goal.find('.steps').remove()
    selected_goal.find('.taskText').append(_steps_HTML(changes['steps'], changes['category']))
}

function get_steps() {
    let edit_steps = $('.editStepEntry')
    let edit_checks = $('.editStepCheck')

    let steps_array = []
    for (let i = 0; i < edit_steps.length; i++) {
        steps_array.push({
            'step_text': edit_steps.eq(i).val(),
            'step_check': Number(edit_checks.eq(i).prop('checked'))
        })
    }

    return steps_array
}

$(document).on('click', '#editMainCheck', () => {
    change_edit_check()
})

function change_edit_check() {
    let check_state = $('#editMainCheck').prop('checked')
    selected_goal.find('.check_task').prop('checked', check_state)

    let position = $('#main .todo').index(selected_goal)

    if (!$('#projectContent').length) {
        change_main_check(position)
        if (check_state) position = $('#main .todo').length - 1
        else position = $('#todosArea .todo').length - 1
        selected_goal = $('#main .todo').eq(position)

    } else {
        change_project_check(selected_goal)
    }
}
