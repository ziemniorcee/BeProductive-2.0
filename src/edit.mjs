import {show_hide_sidebar} from "./sidebar.mjs";
import {
    _categories_HTML,
    change_main_check,
    dragula_day_view,
    set_block_prev_drag_day,
} from "./render.mjs";
import {categories, categories2, check_border, decode_text, encode_text, getIdByColor} from "./data.mjs";
import {dragula_week_view, set_block_prev_drag_week} from "./weekView.mjs";
import {dragula_month_view, set_block_prev_drag_month} from "./monthView.mjs";
import {change_project_emblem, fix_project_sidebar, project_pos,} from "./project.mjs";
import {l_date} from "./date.js";

export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let previous_base = null
let is_edit_change = false
let goal_id = 0
let previous_goal_id = null
let steps_count = 0
let is_new_step = false
let is_from_sidebar = false
let is_from_project = false
let goal_text = ""
let last_step = ""

$(document).on('mousedown', '.todo, .monthTodo, .sidebarTask', function (event) {
    event.stopPropagation()
    let is_different_goal = base !== this || $('#rightbar').css('display') === 'none'

    if (is_different_goal){
        begin_edit(event)
    }
})

function begin_edit(event) {
    let button_code = event.which
    if (button_code === 1 && (event.target.className === "sidebarTask" || event.target.className === "todo"
        || event.target.className === "monthTodo")) {
        event.stopPropagation()
        is_edit_change = true
    }
}

$(document).on('mouseup', '#todosAll .todo, #projectContent .todo', function () {
    build_standard_edit(this)
})

/**
 * builds edit for todo in day view and project view
 * sets array in server
 * sets config and builds rightbar
 * @param that selected task
 */
function build_standard_edit(that) {

    if (is_edit_change) {
        prepare_edit(that, 0)
        window.goalsAPI.setDefaultEdit()
        set_block_prev_drag_day(0)

        _build_edit()
    }
    is_edit_change = false

    $('#editText').blur();
    $('.editTextStep').blur();
}

/**
 * creates edit based on displayed goal
 */
function _build_edit() {
    let goal_config = _get_goal_config(base)
    let steps_html = _steps_html(goal_config["steps"], goal_config["steps_checks"])
    $('#rightbar').html(_edit_html(goal_config, steps_html))
    _fix_main_goal_edit()
    steps_count = $(base).find('.step').length
}

$(document).on('mouseup', '.weekDay .todo', function () {
    build_week_edit(this)
})

/**
 * Builds edit for week view
 * asks database for the rest of the data
 * @param that selected task
 */
function build_week_edit(that) {
    if (is_edit_change) {
        prepare_edit(that, 0)
        set_block_prev_drag_week(0)
        window.goalsAPI.askEditGoal({todo_id: goal_id, option: 0})
    }
    setTimeout(() => {
        is_edit_change = false
    }, 1)
}

$(document).on('mouseup', '#monthGrid .monthTodo', function () {
    build_month_edit(this)
})

/**
 * builds edit for month view
 * @param that selected task
 */
function build_month_edit(that) {
    if (is_edit_change) {
        prepare_edit(that, 1)
        window.goalsAPI.askEditGoal({todo_id: goal_id, option: 0})
        set_block_prev_drag_month(0)
    }
    setTimeout(() => {
        is_edit_change = false
    }, 1)
}

$(document).on('mouseup', '.day .sidebarTask', function () {
    build_history_edit(this)
})

/**
 * builds edit for history sidebar
 * @param that selected task
 */
function build_history_edit(that) {
    if (is_edit_change) {
        prepare_edit(that, 0)
        is_from_sidebar = true
        goal_id = $('.sidebarTask').index(that)
        window.goalsAPI.askEditGoal({todo_id: goal_id, option: 1})
    }
    is_edit_change = false

}

$(document).on('mouseup', '#sideProjectGoals .todo', function () {
    build_sidebar_project_edit(this)
})

/**
 * builds edit for project sidebar
 * @param that selected task
 */
function build_sidebar_project_edit(that) {
    if (is_edit_change) {
        prepare_edit(that, 0)
        is_from_project = true
        goal_id = $('#rightbar .todo').index(that)
        if ($('#todosAll').length) dragula_day_view()
        else if ($('.weekDay').length) dragula_week_view()
        else dragula_month_view()

        window.goalsAPI.askEditGoal({todo_id: goal_id, option: 2})
    }
    is_edit_change = false
}

window.goalsAPI.getEditGoal((goal, steps) => {
    get_edit_goal(goal, steps)
})

/**
 *
 * @param goal data of selected goal
 * @param steps data of selected goal steps
 */
function get_edit_goal(goal, steps) {
    let step_texts = steps.map(step => step.step_text);
    let step_checks = steps.map(step => step.step_check);
    steps_count = step_checks.length
    let steps_html = _steps_html(step_texts, step_checks)

    goal["check_state"] = goal.check_state ? "checked" : ""
    goal["project"] = _project_config(goal.pr_pos)
    $('#rightbar').html(_edit_html(goal, steps_html))
    _fix_main_goal_edit()
}

/**
 * sets all important attritbutes and saves current sidebar
 * @param that selected task
 * @param todo_type 0 - .todo, 1 - monthTodo
 */
function prepare_edit(that, todo_type) {
    is_from_sidebar = false
    is_from_project = false
    previous_base = base
    previous_goal_id = goal_id
    base = event.target

    if (todo_type === 0) {
        goal_id = Number($(that).find('.todoId').text())
    } else if (todo_type === 1) {
        goal_id = Number($(base).find('.monthTodoId').text())
    }

    goal_pressed = true
    let right_bar = $('#rightbar')
    if ($('#editClose').length === 0) saved_sidebar = right_bar.html()
    if (right_bar.css('display') === 'none') show_hide_sidebar()


}

$(document).on('blur', '#editText', function () {
    change_goal_name()
})

/**
 * changes main name of selected goal
 */
function change_goal_name() {
    let selected_base = base
    let selected_goal_id = goal_id

    if (is_edit_change) {
        selected_base = previous_base
        selected_goal_id = previous_goal_id
    }

    let edit_text = $('#editText')
    let input = edit_text.val()

    if (input === "") {
        edit_text.val(goal_text)
        edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    } else if ($(selected_base).find('.task').text().trim() !== input) {
        goal_text = input

        $(selected_base).find('.task').text(input)
        $(selected_base).find('.monthTodoText').text(input)

        let converted_text = encode_text(input)
        window.goalsAPI.changeTextGoal({input: converted_text, id: selected_goal_id, is_previous: is_edit_change})
    }

    is_edit_change = false
}

$(document).on('blur', '.editTextStep', function () {
    change_step(this)
})

/**
 * it changes or deletes step. fixes the counter in goal
 * @param that selected step
 */
function change_step(that) {
    let selected_base = base
    let selected_goal_id = goal_id

    if (is_edit_change) {
        selected_base = previous_base
        selected_goal_id = previous_goal_id
    }

    let edit_text_step = $('.editTextStep')
    let index = edit_text_step.index(that)
    let input = edit_text_step.eq(index).val()
    let converted_step = encode_text(input)
    let current_text = $(selected_base).find('.step_text').eq(index).text()

    if (input !== "") {
        is_new_step = false
        if ((!$(selected_base).find('.stepsShow').length) && ($('#todosAll').length || $('#projectContent').length)) {
            $(selected_base).find('.taskText').append(_steps_show_html(selected_base))
        }
        if ((steps_count < edit_text_step.length && index === edit_text_step.length - 1) || steps_count === edit_text_step.length - 2) {
            $(selected_base).find('.steps').append(_step_html(input))
            _change_counter(index, 0, 1, selected_base)
            steps_count++
            window.goalsAPI.addStep({input: converted_step, id: selected_goal_id, is_previous: is_edit_change})
            last_step = input
        } else if (current_text !== input){
            $(selected_base).find('.step_text').eq(index).text(input)
            window.goalsAPI.changeStep({
                input: converted_step,
                id: selected_goal_id,
                step_id: index,
                is_previous: is_edit_change
            })
        }
    } else {
        if ((!is_new_step && index + 1 !== edit_text_step.length) || (last_step !== "" && !is_new_step)) {
            _change_counter(index, -1, -1, selected_base)
            _remove_step(index, selected_base)
            window.goalsAPI.removeStep({id: selected_goal_id, step_id: index, is_previous: is_edit_change})
        }
        is_new_step = false
    }
    is_edit_change = false
}

/**
 * removes visuals of step
 * @param index step position
 * @param selected_base selected task
 */
function _remove_step(index, selected_base) {
    if ($(selected_base).find('.step').length === 1) {
        $(selected_base).find('.stepsShow').remove()
        $(selected_base).find('.steps').remove()
    } else $(selected_base).find('.step').eq(index).remove()

    steps_count--
    $('.editStep').eq(index).remove()
}

/**
 * change of task steps counter
 * @param index goal position
 * @param current how many checked steps there are in task
 * @param max how many steps there are in task
 * @param selected_base selected task
 */
function _change_counter(index, current, max, selected_base) {
    let max_counter_html = $(selected_base).find('.maxCounter')
    let counter_html = $(selected_base).find('.counter')

    max_counter_html.text(Number(max_counter_html.text()) + max)
    if ($(selected_base).find('.stepCheck').eq(index).prop('checked')) {
        counter_html.text(Number(counter_html.text()) + current)
    }
}


$(document).on('click', '#editCheck', () => {
    change_goal_check()
})

/**
 * changes check in edit
 * depending on type of goal it saves the changed check
 */
function change_goal_check() {
    let state = Number($('#editCheck').prop('checked'))
    $(base).find('.check_task').prop('checked', state)

    let position = $('#main .todo').index(base)

    if (is_from_sidebar) {
        window.sidebarAPI.sideChangeChecks({id: goal_id, state: state, option: 1})
    } else if (is_from_project) {
        window.sidebarAPI.sideChangeChecks({id: goal_id, state: state, option: 2})
    } else {
        change_main_check(position)
    }

    if (!is_from_sidebar && !is_from_project) {
        if (!$('#todosAll').length) close_edit()
        if (state) position = $('#main .todo').length - 1
        else position = $('#todosArea .todo').length - 1
        base = $('#main .todo').eq(position)
    }
}

$(document).on('click', '.editCheckStep', function () {
    check_step_check(this)
})

/**
 * checks step in edit
 * @param that selected step
 */
function check_step_check(that) {
    const index = $('.editCheckStep').index(that)
    const step_check = $(base).find('.stepCheck').eq(index)
    let counter = $(base).find('.counter')

    let state = Number($(that).prop('checked'))
    step_check.prop('checked', state)

    if (state) {
        step_check.replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter.text(Number(counter.text()) + 1)
    } else {
        step_check.replaceWith("<input type='checkbox' class='stepCheck'>")
        counter.text(Number(counter.text()) - 1)
    }
    window.goalsAPI.changeChecksStep({id: goal_id, step_id: index, state: state})
}

$(document).on('click', '#editNewStep', function () {
    add_step()
})

$(document).on('keydown', '.editTextStep', function (event) {
    if (event.which === 9) {
        event.preventDefault()
        add_step()
        is_new_step = true
    }
})

/**
 * adds new step in edit and focus cursos on new input
 */
function add_step() {
    is_new_step = true
    let edit_steps = $('.editTextStep')

    if (edit_steps.eq(edit_steps.length - 1).val() !== "") {
        $('#editSteps').append(
            `<div class="editStep">
            <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep"  spellcheck="false">
        </div>`)
    }

    last_step = ""
    edit_steps = $('.editTextStep')

    edit_steps.eq(edit_steps.length - 1).focus()
}

/**
 * changes goal category to given category id
 * @param category_id which category selected
 */
export function change_category(category_id) {
    $(base).find('.todoCheck').css('backgroundColor', categories[category_id][0])
    $(base).find('.monthTodoLabel').css('backgroundColor', categories[category_id][0])

    if ($("#monthGrid").length) {
        $(base).css('backgroundColor', categories2[category_id - 1])
    }

    if ($(base).find('.stepsShow')) {
        $(base).find('.stepsShow').css('background', categories[category_id][0])
    }
    window.goalsAPI.changeCategory({id: goal_id, new_category: category_id})
}


$(document).on('click', '#editDiff', () => {
    change_difficulty()
})

/**
 * changes difficulty of selected goal
 * changes img of difficulty
 */
function change_difficulty() {
    let position = $('#main .todo').index(base)
    let difficulty = $('#editDiff').val()
    let url = `images/goals/rank${difficulty}.svg`
    if (!is_from_sidebar) {
        $('.todoCheck').eq(position).css('backgroundImage', `url("${url}")`)
    }
    window.goalsAPI.changeDifficulty({id: goal_id, difficulty: difficulty})
}


$(document).on('click', '#editImportance', () => {
    change_importance()
})

/**
 * changes importance of selected goal based on goal position
 */
function change_importance() {
    let position = $('#main .todo').index(base)
    let importance = $('#editImportance').val()
    if (!is_from_sidebar) {
        $('.checkDot').eq(position).css('borderColor', check_border[importance])
    }
    window.goalsAPI.changeImportance({id: goal_id, importance: importance})
}

$(document).on('click', '.editPickProject', function () {
    change_project(this)
})

/**
 * Selects project emblem from project picker
 * @param that selected new project
 */
function change_project(that) {
    let selected_project_pos = $('.editPickProject').index(that) - 1

    if ($("#todosAll").length || $('.weekDay').length || $('#monthGrid').length) {
        change_project_emblem(goal_id, selected_project_pos)
        _fix_project_display(selected_project_pos)
    }
    else if ($('#projectContent').length) {
        if (selected_project_pos < 0) {
            _ask_delete()
        } else if (selected_project_pos !== project_pos) {
            window.goalsAPI.changeProject({id: goal_id, project_pos: selected_project_pos})
            close_edit()
            base.remove()
        }
    }

    $('#editProjectPicker').toggle()
}

/**
 * fixes currently selected project in edit
 * @param new_project_pos new project position
 */
function _fix_project_display(new_project_pos) {
    if (new_project_pos >= 0) {
        let project_color = $('.dashProjectIcon').eq(new_project_pos).css('background-color')
        let project_icon = $('.dashProjectIcon img').eq(new_project_pos).attr('src')

        let edit_project_icon = $('.editProjectIcon')
        edit_project_icon.eq(0).html(`<img class="editPickProjectIcon" src="${project_icon}" alt="">`)
        edit_project_icon.eq(0).css('background-color', project_color)
        $('.editProjectName').eq(0).text($('.dashProjectName').eq(new_project_pos).text())
        $('.editSelectProject').eq(0).html(`<img class="editPickProjectIcon" src="${project_icon}" alt="">`)
        $('#editSelectProject').css("backgroundColor", project_color)
    } else {
        $('.editProjectName').eq(0).text('None')
        $('.editProjectIcon').eq(0).css("backgroundColor", "#D8E1E7")
        $('#editSelectProject').css("backgroundColor", "#FF5D00")
    }
}

/**
 * Displays confirmation window for goal removal
 * it happends in project view in to do section when there
 * is no date in the goal
 */
function _ask_delete() {
    let rightbar = $('#rightbar')
    rightbar.append(`
         <div id="editConfirmProject">
             <div id="editConfirmProjectQuestion">Task will be deleted</div>
             <div id="editConfirmProjectButtons">
                 <div id="editConfirmProjectYes">Delete</div>
                 <div id="editConfirmProjectNo">Cancel</div>
             </div>
         </div>
    `)
    rightbar.css("border-color", "red")
    $('#resizer').css("background-color", "red")
}

$(document).on('click', '#editConfirmProjectYes', () => {
    confirm_delete()
})

/**
 * function after selecting yes in delete question window.
 * Removes goal in project View and fixes ids of goals that are left
 */
function confirm_delete() {
    let local_goal_id = $(base).find(".todoId").text()
    base.remove()
    close_confirm()

    let goals = $('.todoId')
    for (let i = 0; i < goals.length; i++) {
        if (goals.eq(i).html() > local_goal_id) goals.eq(i).html(goals.eq(i).html() - 1)
    }
    close_edit()

    window.goalsAPI.goalRemoved({id: local_goal_id})
}


$(document).on('click', '#editConfirmProjectNo', () => {
    close_confirm()
})

/**
 * closes confim window and fixes colors
 */
function close_confirm() {
    $('#editConfirmProject').remove()
    $('#rightbar').css("border-color", "#D8E1E7")
    $('#resizer').css("background-color", "#D8E1E7")
}


/**
 * creates edit from given configuration
 * @param goal_config all parameter of goal
 * @param steps_html HTML of steps in edit
 * @returns {string} HTML of edit
 */
function _edit_html(goal_config, steps_html) {
    let backgrounds1 = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]
    let backgrounds2 = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

    let categories_html = _categories_HTML()
    let projects_html = _project_picker_HTML()
    let converted_text = decode_text(goal_config["goal"])

    return `<div id="editButtons">
                <div id="editClose">⨉</div>
                <div id="editBack"><img src="images/goals/arrow0.png" alt=""></div>
            </div>
            
            <div id="editTodo">
                <div id="editMain">
                    <input type="checkbox" id="editCheck" ${goal_config["check_state"]}>
                    <textarea  id="editText" rows="1" spellcheck="false">${converted_text}</textarea>
                </div>
                <div id="editStepsContainter">
                    <div id="editSteps">
                        ${steps_html}
                    </div>
                    <div id="editNewStep">
                        <span>+</span>New Step
                    </div>
                </div>
            </div>
            <div id="editOptions">
                <div id="optionsNames">
                    <div>Category</div>
                    <div>Difficulty</div>
                    <div>Importance</div>
                </div>
                <div id="optionsConfig">
                    <div id="selectCategory2" class="selectCategory" style="background: ${categories[goal_config["category"]][0]}">
                        ${categories[goal_config["category"]][1]}
                    </div>
                    <input type="range" class="todoRange" id="editDiff" min="0" max="4" value="${goal_config["difficulty"]}" style="background-color: ${backgrounds1[goal_config["difficulty"]]}">
                    <input type="range" class="todoRange" id="editImportance" min="0" max="4" value="${goal_config["importance"]}" style="background-color: ${backgrounds2[goal_config["importance"]]}">
                    <div class="categoryPicker" id="categoryPicker2">
                        ${categories_html}
                    </div>
                </div>
            </div>
            <div id="editProject">
                <div id="editProjectTitle">Project</div>
                <div id="editSelectProject" style="background-color: ${goal_config['project'][2]}">
                    <div class="editProjectIcon" style="background-color: ${goal_config['project'][1]}">${goal_config['project'][3]}</div>
                    <div class="editProjectName">${goal_config['project'][0]}</div>
                    
                </div>
                <div id="editProjectPicker">
                    ${projects_html}
                </div>
            </div>`
}

/**
 * creates dictionary of goal configuration
 * @param that selected goal
 * @returns dictionary of goal config
 */
function _get_goal_config(that) {
    let goal_config = {}
    goal_config["goal"] = $(that).find('.task').text().trim()
    goal_config["check_state"] = $(that).find('.check_task').prop('checked') === true ? "checked" : ""
    goal_config["category"] = getIdByColor(categories, $(that).find('.todoCheck').css('backgroundColor'))
    goal_config["difficulty"] = $(that).find('.todoCheck')[0].style.backgroundImage[22]
    goal_config["importance"] = check_border.indexOf($(that).find('.checkDot').css('borderColor'))

    let selected_project_pos = ""
    if ($('#todosAll').length) {
        selected_project_pos = $(that).find('.projectPos').text()
    } else if ($('#projectContent').length) {
        selected_project_pos = project_pos
    }

    goal_config['project'] = _project_config(selected_project_pos)

    goal_config["steps"] = $(that).find('.step').map(function () {
        return $(this).text().trim();
    }).get();

    goal_config["steps_checks"] = $(that).find('.stepCheck').map(function () {
        return $(this).prop('checked');
    }).get();

    return goal_config
}

/**
 * creates array of selected goal project config
 * @param new_project_pos selected project position
 * @returns array of project configuration
 */
function _project_config(new_project_pos) {
    let project_config = []
    if (new_project_pos !== "" && new_project_pos !== -1) {
        project_config[0] = $('.dashProjectName').eq(new_project_pos).text()
        project_config[1] = $('.dashProjectIcon').eq(new_project_pos).css('backgroundColor')
        project_config[2] = project_config[1]
        let project_icon = $('.dashProjectIcon img').eq(new_project_pos).attr('src')
        project_config[3] = `<img class="editPickProjectIcon" alt="" src="${project_icon}">`
    } else {
        project_config[0] = 'None'
        project_config[1] = '#D8E1E7'
        project_config[2] = '#FF5D00'
        project_config[3] = ""
    }
    return project_config
}

/**
 * creates steps for edit
 * @param steps data of steps
 * @param checks checks of those steps
 * @returns {string} HTML of edit steps
 */
function _steps_html(steps, checks) {
    let steps_html = ""

    for (let i = 0; i < steps.length; i++) {
        let check_state = ""
        if (checks[i]) check_state = "checked"
        let converted_step = decode_text(steps[i])
        steps_html += `
            <div class="editStep">
                <input type="checkbox" ${check_state} class="editCheckStep">
                <input type="text" class="editTextStep" value='${converted_step}' spellcheck="false">
            </div>`
        last_step = converted_step
    }
    return steps_html
}

/**
 * creates one step
 * @param input text of step
 * @returns {string} HTML of step
 */
function _step_html(input) {
    return `<div class='step'>
                <input type='checkbox'  class='stepCheck'> <span class="step_text">${input}</span>
            </div>`
}

/**
 * creates steps show and hide button in main
 * @param selected_base selected goal
 * @returns {string} HTML of showing steps button
 */
function _steps_show_html(selected_base) {
    let category_id = getIdByColor(categories, $(selected_base).find('.todoCheck').css('backgroundColor'))

    return `<div class='stepsShow' style="background: ${categories[category_id][0]}">
                <img src='images/goals/down.png' alt="up" class="showImg">
                <span class="check_counter">
                    <span class="counter">${0}</span>/<span class="maxCounter">${0}</span>
                </span>
            </div>
            <div class='steps'></div>`
}


/**
 * creates picker based on existing projects
 * @returns {string} HTML of project picker
 */
function _project_picker_HTML() {
    let picks_HTML = `
        <div class="editPickProject">
            <div class="editProjectIcon"></div>
            <div class="editProjectName">None</div>
        </div>`

    for (let i = 0; i < $('.dashProject').length; i++) {
        let icon_color = $('.dashProjectIcon').eq(i).css('backgroundColor')
        let icon_src = $('.dashProjectIcon img').eq(i).attr('src')
        picks_HTML += `
            <div class="editPickProject">
                <div class="editProjectIcon" style="background-color: ${icon_color}">
                    <img class="editPickProjectIcon" alt="" src="${icon_src}">
                </div>
                <div class="editProjectName">${$('.dashProjectName').eq(i).text()}</div>
            </div>`
    }
    return picks_HTML
}

$(document).on('click', '.viewOption', function () {
    is_edit_change = false
})

$(document).on('mousedown', '#main, #editClose, #editBack', () => {
    if (!$(event.target).is('#sideHistory') && !$(event.target).is('#sideIdeas') && !$(event.target).is('.projectType'))  {
        close_edit()
    }
})

/**
 * closes edit sidebar
 * if there was previous sidebar, it returns to prevuous state
 * else it hides
 * if history goal was edited, resets history sidebar
 * if project goal was edited, resets project sidebar
 */
export function close_edit() {
    base = null
    if (goal_pressed === true) {
        goal_pressed = false
        if (saved_sidebar.trim() === "") {
            $('#rightbar').css('display', 'none')
            $('#resizer').css('display', 'none')
            saved_sidebar = ""
        } else {
            $('#rightbar').html(saved_sidebar)
            if ($('#todosAll').length) dragula_day_view()
            else if ($('.weekDay').length) dragula_week_view()
            else dragula_month_view()
        }
        if ($('#days').length) window.sidebarAPI.askHistory({date: l_date.day_sql})
        else if ($('#sideProjectGoals').length) fix_project_sidebar()
    } else goal_pressed = false
}

/**
 * fixes edit goal input so it wraps text correctly
 */
function _fix_main_goal_edit() {
    let edit_text = $('#editText')
    edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    edit_text.on('input', function () {
        this.style.height = 'auto'
        this.style.height = `${this.scrollHeight}px`
    })
}


export function fix_goal_pos() {
    if (!is_from_sidebar && !is_from_project) {
        let position = $('#main .todoId').index($(base).find('.todoId'))
        base = $('#main .todo').eq(position)
        previous_base = $('#main .todo').eq(position)

        if ($('#monthGrid').length) {
            position = Number($(base).find('.monthTodoId').text())
            base = $('#main .monthTodo').eq(position)
            previous_base = $('#main .monthTodo').eq(position)
        }
    }
    is_edit_change = false
}
