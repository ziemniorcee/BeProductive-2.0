import {show_hide_sidebar} from "./sidebar.mjs";
import {
    _build_categories,
    change_check,
    dragula_day_view,
    set_block_prev_drag_day,
    set_todo_dragged,
    todo_dragged
} from "./render.mjs";
import {categories, categories2, check_border, getIdByColor} from "./data.mjs";
import {dragula_week_view, set_block_prev_drag_week} from "./weekView.mjs";
import {dragula_month_view, set_block_prev_drag_month} from "./monthView.mjs";
import {change_project_emblem, project_pos, set_block_prev_drag_project} from "./project.mjs";
import {l_date} from "./date.js";

export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let is_edit_change = false
let goal_pos = 0
let goal_id = 0
let steps_count = 0
let is_new_step = false
let is_from_sidebar = false
let is_from_project = false
let sidebar_change_goal = {}
let goal_text = ""
let last_step = ""

$(document).on('mousedown', '.todo, .monthTodo, .sidebarTask', function (event) {
    let button_code = event.which
    if (button_code === 1 && (event.target.className === "sidebarTask" || event.target.className === "todo"
        || event.target.className === "monthTodo")) {
        event.stopPropagation()
        is_edit_change = true
    }
})


$(document).on('mouseup', '.todo, .monthTodo, .day .sidebarTask', function () {
    if (!todo_dragged && is_edit_change === true) {
        is_from_sidebar = false
        is_from_project = false
        set_block_prev_drag_day(0)
        set_block_prev_drag_week(0)
        set_block_prev_drag_month(0)
        set_block_prev_drag_project(0)
        goal_pressed = true
        base = event.target
        let right_bar = $('#rightbar')
        if ($('#editClose').length === 0) saved_sidebar = right_bar.html()
        if (right_bar.css('display') === 'none') show_hide_sidebar()


        goal_id = Number($(this).find('.todoId').text())
        goal_pos = $('.todo').index(this)

        if ($(this).attr('class') === 'sidebarTask') {
            is_from_sidebar = true
            goal_id = $('.sidebarTask').index(this)
            window.goalsAPI.askGoalInfo({todo_id: goal_id, option: 1})
        } else if ($(this).parent().attr('id') === 'sideProjectGoals') {
            is_from_project = true
            goal_id = Number($(base).find('.todoId').text())
            window.goalsAPI.askGoalInfo({todo_id: goal_id, option: 2})
        } else if ($('#todosAll').length || $('#projectContent').length) {
            window.goalsAPI.setDefaultEdit()
            _build_edit()
        } else if ($('.weekDay').length) window.goalsAPI.askGoalInfo({todo_id: goal_id, option: 0})
        else if ($('#monthGrid').length) {
            goal_id = Number($(base).find('.monthTodoId').text())
            goal_pos = $('.monthTodo').index(this)
            window.goalsAPI.askGoalInfo({todo_id: goal_id, option: 0})
        }
    } else set_todo_dragged(false)
    is_edit_change = false
})

function _build_edit() {
    let goal_config = _get_goal_config(base)
    let steps_html = _steps_html(goal_config["steps"], goal_config["steps_checks"])
    $('#rightbar').html(_edit_html(goal_config, steps_html))
    _fix_main_goal_edit()
    steps_count = $(base).find('.step').length
}

$(document).on('click', '.viewOption', function () {
    is_edit_change = false
})

// Blocks to do click when children were clicked
// $(document).on('mousedown', '.todo > *', function (event) {
//     console.log("XPaaP")
//     close_edit()
// })

$(document).on('mousedown', '#main', (event) => {
    let opening_sidebar = $('#projectTypes').css('display') === "block" || $('.sidebars').css('display') === "block"

    if (goal_pressed && !opening_sidebar) {
        close_edit(event)
        if ($('#todosAll').length) dragula_day_view()
        else if ($('.weekDay').length) dragula_week_view()
        else dragula_month_view()
    }
    goal_pressed = false
})

$(document).on('click', '#editClose', () => close_edit(true))

$(document).on('click', '#editBack', () => close_edit())


$(document).on('blur', '#editText', () => {
    if (!is_edit_change) change_goal_main(this)
    is_edit_change = false
})

$(document).on('blur', '.editTextStep', function () {
    if (!is_edit_change) steps_change(this)
    is_edit_change = false
})


function change_goal_main() {
    let edit_text = $('#editText')
    let input = edit_text.val()

    if (input === "") {
        edit_text.val(goal_text)
        edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    } else if ($(base).find('.task').text().trim() !== input) {
        goal_text = input
        $(base).find('.task').text(input)
        $(base).find('.monthTodoText').text(input)
        let converted_text = input.replace(/'/g, "`@`").replace(/"/g, "`@@`")

        if (is_from_sidebar) sidebar_change_goal = {text: input, id: goal_id}

        window.goalsAPI.changeTextGoal({input: converted_text, id: goal_id})
    }
}

function steps_change(that) {
    let edit_text_step = $('.editTextStep')
    let index = edit_text_step.index(that)
    let input = edit_text_step.eq(index).val()
    let converted_step = input.replace(/'/g, "`@`").replace(/"/g, "`@@`")


    if (input !== "") {
        is_new_step = false
        if ((!$(base).find('.stepsShow').length) && ($('#todosAll').length || $('#projectContent').length)) $(base).find('.taskText').append(_steps_show_html())
        if ((steps_count < edit_text_step.length && index === edit_text_step.length - 1) || steps_count === edit_text_step.length - 2) {
            $(base).find('.steps').append(_step_html(input))
            _change_counter(index, 0, 1)

            steps_count++
            window.goalsAPI.addStep({input: converted_step, id: goal_id})
            last_step = input
        } else {
            $(base).find('.step_text').eq(index).text(input)
            window.goalsAPI.changeStep({input: converted_step, id: goal_id, step_id: index})
        }
    } else {
        if ((!is_new_step && index + 1 !== edit_text_step.length) || (last_step !== "" && !is_new_step)) {
            _change_counter(index, -1, -1)
            _remove_step(index)
            window.goalsAPI.removeStep({id: goal_id, step_id: index})
        }
        is_new_step = false
    }
}

function _remove_step(index) {
    if ($(base).find('.step').length === 1) {
        $(base).find('.stepsShow').remove()
        $(base).find('.steps').remove()
    } else $(base).find('.step').eq(index).remove()

    steps_count--
    $('.editStep').eq(index).remove()
}

function _change_counter(index, current, max) {
    let max_counter_html = $(base).find('.maxCounter')
    let counter_html = $(base).find('.counter')

    max_counter_html.text(Number(max_counter_html.text()) + max)
    if ($(base).find('.stepCheck').eq(index).prop('checked')) counter_html.text(Number(counter_html.text()) + current)
}


$(document).on('click', '#editCheck', () => {
    let state = Number($('#editCheck').prop('checked'))
    $(base).find('.check_task').prop('checked', state)
    let sidebar_option = 0
    if (is_from_sidebar) sidebar_option = 1
    else if (is_from_project) sidebar_option = 2
    change_check(goal_id, sidebar_option, state)


    if (!is_from_sidebar && !is_from_project) {
        if (!$('#todosAll').length) close_edit()
        if (state) goal_pos = $('.todo').length - 1
        else goal_pos = $('#todosArea').children().length - 1

        base = document.getElementsByClassName("todo")[goal_pos]
    }

})

$(document).on('click', '.editCheckStep', function () {
    const index = $('.editCheckStep').index(this)
    const step_check = $(base).find('.stepCheck').eq(index)
    let counter = $(base).find('.counter')

    let state = Number($(this).prop('checked'))
    step_check.prop('checked', state)

    if (state) {
        step_check.replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter.text(Number(counter.text()) + 1)
    } else {
        step_check.replaceWith("<input type='checkbox' class='stepCheck'>")
        counter.text(Number(counter.text()) - 1)
    }
    window.goalsAPI.changeChecksStep({id: goal_id, step_id: index, state: state})
})

$(document).on('click', '#editNewStep', function () {
    new_step()
})

$(document).on('keydown', '.editTextStep', function (event) {
    if (event.which === 9) {
        event.preventDefault()
        new_step()
        is_new_step = true
    }
})

function new_step() {
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

export function change_category(category_id) {
    $(base).find('.todoCheck').css('backgroundColor', categories[category_id][0])
    $(base).find('.monthTodoLabel').css('backgroundColor', categories[category_id][0])

    if ($("#monthGrid").length) $(base).css('backgroundColor', categories2[category_id - 1])

    if ($(base).find('.stepsShow')) {
        $(base).find('.stepsShow').css('background', categories[category_id][0])
    }
    window.goalsAPI.changeCategory({id: goal_id, new_category: category_id})
}


$(document).on('click', '#editDiff', () => {
    let difficulty = $('#editDiff').val()
    let url = `images/goals/rank${difficulty}.svg`
    if (!is_from_sidebar) $('.todoCheck').eq(goal_pos).css('backgroundImage', `url("${url}")`)
    window.goalsAPI.changeDifficulty({id: goal_id, difficulty: difficulty})
})


$(document).on('click', '#editImportance', () => {
    let importance = $('#editImportance').val()
    if (!is_from_sidebar) $('.checkDot').eq(goal_pos).css('borderColor', check_border[importance])
    window.goalsAPI.changeImportance({id: goal_id, importance: importance})
})

export function close_edit() {
    if (goal_pressed === true ) {
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
        if (is_from_sidebar) $('.historyText').eq(sidebar_change_goal['id']).text(sidebar_change_goal['text'])
    } else goal_pressed = false


}



export function goal_pressed_false() {
    goal_pressed = false
}

window.goalsAPI.getEditInfo((goal, steps) => {
    let step_texts = steps.map(step => step.step_text);
    let step_checks = steps.map(step => step.step_check);
    steps_count = step_checks.length
    let steps_html = _steps_html(step_texts, step_checks)

    goal["check_state"] = goal.check_state ? "checked" : ""
    goal["project"] = _project_config(goal.pr_pos)
    $('#rightbar').html(_edit_html(goal, steps_html))
    _fix_main_goal_edit()
})

$(document).on('click', '#editSelectProject', function (event) {
    event.stopPropagation()
    $('#editProjectPicker').toggle()
})

$(document).on('click', '.editPickProject', function () {
    pick_project(this)
})

/**
 * Selects project emblem from project picker
 * @param that selected new project
 */
function pick_project(that) {
    let selected_project_pos = $('.editPickProject').index(that) - 1

    if ($("#todosAll").length) {
        change_project_emblem(goal_id, selected_project_pos)
        fix_project_edit(selected_project_pos)
    } else if ($('#projectContent').length) {
        if (selected_project_pos < 0) ask_to_delete()
        else if (selected_project_pos !== project_pos) {
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
function fix_project_edit(new_project_pos) {
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
 * Displays question window adn changes color of rightbar border
 */
function ask_to_delete() {
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


function _edit_html(goal_config, steps_html) {
    let backgrounds1 = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]
    let backgrounds2 = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

    let categories_html = _build_categories()
    let projects_html = _build_project_picker()
    let converted_text = goal_config["goal"].replace(/`@`/g, "'").replace(/`@@`/g, '"');
    goal_text = converted_text

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

function _project_config(new_project_pos) {
    let project_config = []
    if (new_project_pos !== "" && new_project_pos !== -1) {
        project_config[0] = $('.dashProjectName').eq(new_project_pos).text()
        project_config[1] = $('.dashProjectIcon').eq(new_project_pos).css('backgroundColor')
        project_config[2] = project_config[1]
        let project_icon = $('.dashProjectIcon img').eq(new_project_pos).attr('src')
        project_config[3] = `<img class="editPickProjectIcon" src="${project_icon}">`
    } else {
        project_config[0] = 'None'
        project_config[1] = '#D8E1E7'
        project_config[2] = '#FF5D00'
        project_config[3] = ""
    }
    return project_config
}

function _steps_html(steps, checks) {
    let steps_html = ""

    for (let i = 0; i < steps.length; i++) {
        let check_state = ""
        if (checks[i]) check_state = "checked"
        let converted_step = steps[i].replace(/`@`/g, "'").replace(/`@@`/g, '"')
        steps_html += `
            <div class="editStep">
                <input type="checkbox" ${check_state} class="editCheckStep">
                <input type="text" class="editTextStep" value='${converted_step}' spellcheck="false">
            </div>`
        last_step = converted_step
    }
    return steps_html
}

function _step_html(input) {
    return `<div class='step'>
                <input type='checkbox'  class='stepCheck'> <span class="step_text">${input}</span>
            </div>`
}

function _steps_show_html() {
    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))

    return `<div class='stepsShow' style="background: ${categories[category_id][0]}">
                <img src='images/goals/down.png' alt="up" class="showImg">
                <span class="check_counter">
                    <span class="counter">${0}</span>/<span class="maxCounter">${0}</span>
                </span>
            </div>
            <div class='steps'></div>`
}

function _fix_main_goal_edit() {
    let edit_text = $('#editText')
    edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    edit_text.on('input', function () {
        this.style.height = 'auto'
        this.style.height = `${this.scrollHeight}px`
    })
}

function _build_project_picker() {
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
                    <img class="editPickProjectIcon" src="${icon_src}">
                </div>
                <div class="editProjectName">${$('.dashProjectName').eq(i).text()}</div>
            </div>`
    }
    return picks_HTML
}

export function set_goal_pos(id) {
    goal_pos = id
}