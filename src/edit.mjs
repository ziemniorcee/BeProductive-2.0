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

export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let is_edit_change = false
let goal_pos = 0
let goal_id = 0
let steps_count = 0
let is_new_step = false

$(document).on('mousedown', '.todo, .monthTodo', function (event) {
    event.stopPropagation()
    is_edit_change = true
})


$(document).on('mouseup', '.todo, .monthTodo', function () {
    if (!todo_dragged && is_edit_change === true) {
        set_block_prev_drag_day(0)
        set_block_prev_drag_week(0)
        set_block_prev_drag_month(0)
        goal_pressed = true
        base = event.target
        let right_bar = $('#rightbar')
        if ($('#editClose').length === 0) saved_sidebar = right_bar.html()
        if (right_bar.css('display') === 'none') show_hide_sidebar()


        if ($('#monthGrid').length) {
            goal_id = Number($(base).find('.monthTodoId').text())
            goal_pos = $('.monthTodo').index(this)
        } else {
            goal_id = Number($(this).find('.todoId').text())
            goal_pos = $('.todo').index(this)
        }

        if ($('#todosAll').length) {
            let goal_config = _get_goal_config(base)
            let steps_html = _steps_html(goal_config["steps"], goal_config["steps_checks"])
            right_bar.html(_edit_html(goal_config, steps_html))
            _fix_main_goal_edit()
            steps_count = $(base).find('.step').length
        } else window.goalsAPI.askSteps({todo_id: goal_id})
    } else set_todo_dragged(false)
    is_edit_change = false
})

$(document).on('click', '.viewOption', function () {
    is_edit_change = false
})

// Blocks to do click when children were clicked
$(document).on('mousedown', '.todo > *', function (event) {
    event.stopPropagation()
    close_edit()

})

$(document).on('mousedown', '#main', () => {
    if (goal_pressed) {
        close_edit()
        if ($('#todosAll').length) dragula_day_view()
        else if ($('.weekDay').length) dragula_week_view()
        else dragula_month_view()
    }

})

$(document).on('click', '#editClose', () => show_hide_sidebar())

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
        edit_text.val($(base).find('.task').text().trim())
        edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    } else if ($(base).find('.task').text().trim() !== input) {
        $(base).find('.task').text(input)
        $(base).find('.monthTodoText').text(input)
        let converted_text = input.replace(/'/g, "`@`").replace(/"/g, "`@@`")
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
        if ((!$(base).find('.stepsShow').length) && $('#todosAll').length) $(base).find('.taskText').append(_steps_show_html())
        if (steps_count < edit_text_step.length && index === edit_text_step.length - 1) {
            $(base).find('.steps').append(_step_html(input))
            _change_counter(index, 0, 1)

            steps_count++
            window.goalsAPI.addStep({input: converted_step, id: goal_id})
        } else {
            $(base).find('.step_text').eq(index).text(input)
            window.goalsAPI.changeStep({input: converted_step, id: goal_id, step_id: index})
        }
    } else {
        if (!is_new_step) {
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
    change_check(goal_pos)
    if (!$('#todosAll').length) close_edit()

    if (state) goal_pos = $('.todo').length - 1
    else goal_pos = $('#todosArea').children().length - 1

    base = document.getElementsByClassName("todo")[goal_pos]
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
    is_new_step = true
    let edit_steps = $('.editTextStep')

    if (edit_steps.eq(edit_steps.length - 1).val() !== "") {
        $('#editSteps').append(
            `<div class="editStep">
            <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep"  spellcheck="false">
        </div>`)
    }

    edit_steps.eq(edit_steps.length).focus()
})


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
    $('.todoCheck').eq(goal_pos).css('backgroundImage', `url("${url}")`)
    window.goalsAPI.changeDifficulty({id: goal_id, difficulty: difficulty})
})


$(document).on('click', '#editImportance', () => {
    let importance = $('#editImportance').val()
    $('.checkDot').eq(goal_pos).css('borderColor', check_border[importance])
    window.goalsAPI.changeImportance({id: goal_id, importance: importance})
})

export function close_edit() {
    if (goal_pressed === true) {
        goal_pressed = false
        document.getElementById("rightbar").innerHTML = saved_sidebar
    } else goal_pressed = false
}

export function goal_pressed_false() {
    goal_pressed = false
}

window.goalsAPI.getSteps((goal, steps) => {
    let step_texts = steps.map(step => step.step_text);
    let step_checks = steps.map(step => step.step_check);
    steps_count = step_checks.length
    let steps_html = _steps_html(step_texts, step_checks)
    let goal_config = _get_goal_config2(goal[0])

    $('#rightbar').html(_edit_html(goal_config, steps_html))
    _fix_main_goal_edit()
})

function _edit_html(goal_config, steps_html) {
    let categories_html = _build_categories()
    let converted_text = goal_config["main_goal"].replace(/`@`/g, "'").replace(/`@@`/g, '"');

    return `<div id="editClose">⨉</div>
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
                    <div id="selectCategory2" class="selectCategory" style="background: ${categories[goal_config["category"]][0]}">${categories[goal_config["category"]][1]}</div>
                    <input type="range" class="todoRange" id="editDiff" min="0" max="4" value="${goal_config["difficulty"]}">
                    <input type="range" class="todoRange" id="editImportance" min="0" max="4" value="${goal_config["importance"]}">
                    <div class="categoryPicker" id="categoryPicker2">
                        ${categories_html}
                    </div>
                </div>
            </div>`
}

function _get_goal_config(that) {
    let goal_config = {}

    goal_config["main_goal"] = $(that).find('.task').text().trim()
    goal_config["check_state"] = $(that).find('.check_task').prop('checked') === true ? "checked" : ""
    goal_config["category"] = getIdByColor(categories, $(that).find('.todoCheck').css('backgroundColor'))
    goal_config["difficulty"] = $(that).find('.todoCheck')[0].style.backgroundImage[22]
    goal_config["importance"] = check_border.indexOf($(that).find('.checkDot').css('borderColor'))


    goal_config["steps"] = $(that).find('.step').map(function () {
        return $(this).text().trim();
    }).get();

    goal_config["steps_checks"] = $(that).find('.stepCheck').map(function () {
        return $(this).prop('checked');
    }).get();

    return goal_config
}

function _get_goal_config2(goal) {
    let goal_config = {}
    goal_config["main_goal"] = goal.goal
    goal_config["check_state"] = goal.check_state === true ? "checked" : ""
    goal_config["category"] = goal.category
    goal_config["difficulty"] = goal.Difficulty
    goal_config["importance"] = goal.Importance

    return goal_config
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
                <input type="text" class="editTextStep" value=`+converted_step+` spellcheck="false">
            </div>`
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

export function set_goal_pos(id){
    goal_pos = id
}