import {show_hide_sidebar} from "./sidebar.mjs";
import {change_check} from "./render.mjs";
import {categories, categories2, check_border, getIdByColor} from "./data.mjs";

export let saved_sidebar = ""
export let goal_pressed = false

let edit_state = 0
let is_edit_change = false

let base = null
let goal_pos = 0
let goal_id = 0
let steps_count = 0

let goal_config = {"main_goal": "", "check_state": "", "category": 1, "difficulty": 2, "importance": 2, "steps": ""}

$(document).on('click', '.viewOption', function () {
    edit_state = 0
    is_edit_change = false
})

$(document).on('click', '.todo', function (event) {
    is_edit_change = true

    if (edit_state === 0) edit_state = 2
    else {
        edit_state = 1
        change_goal_main()
        pre_steps_change()
    }

    event.stopPropagation()
    let right_bar = $('#rightbar')
    if ($('#editClose').length === 0) saved_sidebar = right_bar.html()

    goal_pos = $('.todo').index(this)
    if (right_bar.css('display') === 'none') show_hide_sidebar()

    base = event.target
    goal_pressed = true

    goal_config["main_goal"] = $(base).find('.task').text().trim()
    goal_config["check_state"] = $(base).find('.check_task').prop('checked') === true ? "checked" : ""
    goal_config["category"] = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))
    goal_config["difficulty"] = document.getElementsByClassName("todoCheck")[goal_pos].style.backgroundImage[22]
    goal_config["importance"] = check_border.indexOf($(base).find('.checkDot').css('borderColor'))

    goal_id = Number($(base).find('.todoId').text())

    if ($(base).closest('.weekDayGoals').length) window.goalsAPI.askSteps({todo_id: goal_id})
    else {
        goal_config["steps"] = _get_steps_html($(base).find('.step'), 0)
        todo_html()
    }

    is_edit_change = false
})

$(document).on('click', '.monthTodo', function (event) {
    event.stopPropagation()
    let right_bar = $('#rightbar')
    if ($('#editClose').length === 0) saved_sidebar = right_bar.html()

    goal_pos = $('.monthTodo').index(this)

    if (right_bar.css('display') === 'none') show_hide_sidebar()

    base = event.target
    goal_pressed = true

    goal_id = Number($(base).find('.monthTodoId').text())

    window.goalsAPI.askSteps({todo_id: goal_id})
})


// Blocks to do click when children were clicked
$(document).on('click', '.todo > *', function (event) {
    event.stopPropagation()
    close_edit()
})

$(document).on('click', '#main', () => close_edit())

$(document).on('click', '#editClose', () => show_hide_sidebar())


$(document).on('click', '#editCheck', () => {
    let state = Number($('#editCheck').prop('checked'))
    $(base).find('.check_task').prop('checked', state)
    change_check(goal_pos)

    if (state) goal_pos = $('.todo').length - 1
    else goal_pos = $('#todosArea').children().length - 1

    base = document.getElementsByClassName("todo")[goal_pos] // to change
})


$(document).on('blur', '#editText', () => {
    if (edit_state === 2) change_goal_main()
    else if (is_edit_change === false) change_goal_main()

    edit_state = 2
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
        window.goalsAPI.changeTextGoal({input: input, id: goal_id})
    }
}

$(document).on('blur', '.editTextStep', function () {
    if (edit_state === 2) steps_change(this)
    else if (is_edit_change === false) steps_change(this)
    edit_state = 2
})

function steps_change(that) {
    let edit_text_step = $('.editTextStep')
    let index = edit_text_step.index(that)
    let input = edit_text_step.eq(index).val()
    let steps_count = $(base).find('.step').length
    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))

    if (!$(base).closest('.weekDayGoals').length && input !== "") {
        if (!$(base).find('.stepsShow').length) {
            $(base).find('.taskText').append(
                `<div class='stepsShow' style="background: ${categories[category_id][0]}"><img src='images/goals/down.png' alt="up" class="showImg">
                <span class="check_counter">
                    <span class="counter">${0}</span>/<span class="maxCounter">${0}</span>
                </span>
            </div>
            <div class='steps'></div>`)
        }
    }

    if (steps_count < edit_text_step.length && index + 1 === edit_text_step.length) {
        if (input !== "") {
            if (!$(base).closest('.weekDayGoals').length) {
                $(base).find('.steps').append(
                    `<div class='step'>
                    <input type='checkbox'  class='stepCheck'> <span class="step_text">${input}</span>
                </div>`)

                let max_counter = $(base).find('.maxCounter')
                max_counter.text(Number(max_counter.text()) + 1)
            }
            steps_count += 1
            window.goalsAPI.addStep({input: input, id: goal_id})
        }
    } else change_step(index, input)
}

function pre_steps_change() {
    let edit_text_step = $('.editTextStep')
    if (edit_text_step.length > $(base).find('.step').length) steps_change(edit_text_step.eq(edit_text_step.length - 1))
}

function change_step(index, value) {
    if (value !== "") {
        $(base).find('.step_text').eq(index).text(value)

        window.goalsAPI.changeStep({input: value, id: goal_id, step_id: index})
    } else {
        let max_counter_html = $(base).find('.maxCounter')
        let counter_html = $(base).find('.counter')

        max_counter_html.text(Number(max_counter_html.text()) - 1)
        if ($(base).find('.stepCheck').eq(index).prop('checked')) counter_html.text(Number(counter_html.text()) - 1)

        if ($(base).find('.step').length === 1) {
            $(base).find('.stepsShow').remove()
            $(base).find('.steps').remove()
        } else $(base).find('.step').eq(index).remove()

        $('.editStep').eq(index).remove()

        steps_count--
        window.goalsAPI.removeStep({id: goal_id, step_id: index})
    }
}


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

$(document).on('click', '#editNewStep', () => {
    let steps_html = ""

    if ($(base).closest('.weekDayGoals').length) steps_html = _get_steps_html($('.editStep'), 1)
    else steps_html = _get_steps_html($(base).find('.step'), 0)

    steps_html +=
        `<div class="editStep">
            <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep"  spellcheck="false">
        </div>`

    $('#editSteps').html(
        `${steps_html}
            <div id="editNewStep">
                <span>+</span>New Step
            </div>`)
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


function _get_steps_html(steps, option) {
    let steps_html = ""

    if (steps.length > 0) {
        for (let i = 0; i < steps.length; i++) {
            let check_state = ""
            if (steps.eq(i).find(option ? ".editCheckStep" : ".stepCheck").prop('checked') === true) check_state = "checked"

            let value = option ? steps.eq(i).find('.editTextStep').val() : steps.eq(i).text()
            steps_html += `
                <div class="editStep">
                    <input type="checkbox" ${check_state} class="editCheckStep"><input type="text" class="editTextStep" value="${value.trim()}" spellcheck="false">
                </div>`
        }
        steps_count = steps.length
    }
    return steps_html
}


window.goalsAPI.getSteps((goal, steps) => {
    let steps_html = ""
    for (let i = 0; i < steps.length; i++) {
        let check_state = ""
        if (steps[i].step_check) check_state = "checked"

        steps_html += `
             <div class="editStep">
                 <input type="checkbox" ${check_state} class="editCheckStep"><input type="text" class="editTextStep" value="${steps[i].step_text}" spellcheck="false">
             </div>`
    }

    steps_count = steps.length
    goal_config["steps"] = steps_html

    if ($('#monthGrid').length) {
        goal_config["main_goal"] = goal[0].goal
        goal_config["check_state"] = goal[0].check_state === true ? "checked" : ""
        goal_config["category"] = goal[0].category
        goal_config["difficulty"] = goal[0].Difficulty
        goal_config["importance"] = goal[0].Importance
    }
    todo_html()
})


function todo_html() {
    let edit =
        `<div id="editClose">⨉</div>
        <div id="editTodo">
            <div id="editMain">
                <input type="checkbox" id="editCheck" ${goal_config["check_state"]}>
                <textarea  id="editText" rows="1" spellcheck="false">${goal_config["main_goal"]}</textarea>
            </div>
            <div id="editSteps">
                ${goal_config["steps"]}
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
                    <div class="category">
                        <span class="categoryButton"></span>
                        <span class="categoryName">None</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #32174D"></span>
                        <span class="categoryName">Work</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #002244"></span>
                        <span class="categoryName">School</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #023020"></span>
                        <span class="categoryName">House</span>
                    </div>
                </div>
            </div>
        </div>`;
    $('#rightbar').html(edit)

    let edit_text = $('#editText')
    edit_text.css('height', `${edit_text[0].scrollHeight}px`)
    edit_text.on('input', function () {
        this.style.height = 'auto'
        this.style.height = `${this.scrollHeight}px`
    })

}