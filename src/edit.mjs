import {show_hide_sidebar} from "./sidebar.mjs";
import {change_check} from "./render.mjs";
import {categories, check_border, getIdByColor} from "./data.mjs";

export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let goal_id = 0
let steps_count = 0


$(document).on('click', '.todo', function (event) {
    event.stopPropagation()
    let right_bar = $('#rightbar')
    if ($('#editClose').length === 0) saved_sidebar = right_bar.html()

    goal_id = $('.todo').index(this)

    if (right_bar.css('display') === 'none') show_hide_sidebar()

    base = event.target
    goal_pressed = true

    if ($(base).closest('.weekDayGoals').length) {
        window.goalsAPI.askSteps({todo_id: $(base).find('.todoId').text()})
    } else{
        let steps_html = _get_steps_html($(base).find('.step'), 0)
        right_bar.html(todo_html(steps_html))
    }
});


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
    change_check(goal_id)


    if (state) goal_id = $('.todo').length - 1
    else goal_id = $('#todosArea').children().length - 1

    base = document.getElementsByClassName("todo")[goal_id] // to change
})


$(document).on('blur', '#editText', () => {
    let input = $('#editText').val()

    if ($(base).find('.task').text() !== input) {
        $(base).find('.task').text(input)

        window.goalsAPI.changeTextGoal({input: input, id: Number($(base).find('.todoId').text())})
    }
})

$(document).on('blur', '.editTextStep', function () {
    const edit_text_step = $('.editTextStep')
    let index = edit_text_step.index(this)
    let input = edit_text_step.eq(index).val()

    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))

    if (!$(base).closest('.weekDayGoals').length) {
        console.log("XPPSD")
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

    if (steps_count < edit_text_step.length) {
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
            window.goalsAPI.addStep({input: input, id: Number($(base).find('.todoId').text())})
        }
    } else change_step(index, input)
})


function change_step(index, value) {
    if (value !== "") {
        $(base).find('.step_text').eq(index).text(value)

        window.goalsAPI.changeStep({input: value, id: Number($(base).find('.todoId').text()), step_id: index})
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


        window.goalsAPI.removeStep({id: Number($(base).find('.todoId').text()), step_id: index})
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
    window.goalsAPI.changeChecksStep({goal_id: Number($(base).find('.todoId').text()), step_id: index, state: state})
})

$(document).on('click', '#editNewStep', () => {
    let steps_html = ""

    if ($(base).closest('.weekDayGoals').length) steps_html = _get_steps_html($('.editStep'),1)
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

    if ($(base).find('.stepsShow')) {
        $(base).find('.stepsShow').css('background', categories[category_id][0])
    }
    window.goalsAPI.changeCategory({id: Number($(base).find('.todoId').text()), new_category: category_id})
}


$(document).on('click', '#editDiff', () => {
    let difficulty = $('#editDiff').val()
    let url = `images/goals/rank${difficulty}.svg`
    $('.todoCheck').eq(goal_id).css('backgroundImage', `url("${url}")`)
    window.goalsAPI.changeDifficulty({id: Number($(base).find('.todoId').text()), difficulty: difficulty})
})


$(document).on('click', '#editImportance', () => {

    let importance = $('#editImportance').val()
    $('.checkDot').eq(goal_id).css('borderColor', check_border[importance])
    window.goalsAPI.changeImportance({id: Number($(base).find('.todoId').text()), importance: importance})
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


window.goalsAPI.getSteps((steps) => {
    let steps_html = ""
    for(let i =0; i < steps.length; i++){
        let check_state = ""
        if (steps[i].step_check) check_state = "checked"

        steps_html += `
             <div class="editStep">
                 <input type="checkbox" ${check_state} class="editCheckStep"><input type="text" class="editTextStep" value="${steps[i].step_text}" spellcheck="false">
             </div>`
    }

    steps_count = steps.length
    $('#rightbar').html(todo_html(steps_html))
})

function todo_html(steps_html) {
    let main_goal = $(base).find('.task').text().trim()

    let check_state = $(base).find('.check_task').prop('checked') === true ? "checked" : "";

    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))
    let difficulty = document.getElementsByClassName("todoCheck")[goal_id].style.backgroundImage[22]//weak point

    let importance = check_border.indexOf($(base).find('.checkDot').css('borderColor'))

    return `<div id="editClose">⨉</div>
        <div id="editTodo">
            <div id="editMain">
                <input type="checkbox" id="editCheck" ${check_state}>
                <input type="text" id="editText" value="${main_goal}" spellcheck="false">
            </div>
            <div id="editSteps">
                ${steps_html}
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
                <div id="selectCategory2" class="selectCategory" style="background: ${categories[category_id][0]}">${categories[category_id][1]}</div>
                <input type="range" class="todoRange" id="editDiff" min="0" max="4" value="${difficulty}">
                <input type="range" class="todoRange" id="editImportance" min="0" max="4" value="${importance}">
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
}