import {show_hide_sidebar} from "./sidebar.mjs";
import {change_check} from "./render.mjs";
import {categories, check_border, getIdByColor} from "./data.mjs";

export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let goal_id = 0


$(document).on('click', '.todo', function (event) {
    event.stopPropagation()
    let right_bar = $('#rightbar')
    if ($('#closeEdit').length === 0) saved_sidebar = right_bar.html()


    goal_id = $('.todo').index(this)

    if (right_bar.css('display') === 'none') show_hide_sidebar()

    base = event.target
    goal_pressed = true

    right_bar.html(todo_html())
});


// Blocks to do click when children were clicked
$(document).on('click', '.todo > *', function (event) {
    event.stopPropagation()
    close_edit()
})

$(document).on('click', '#main', () => close_edit())

$(document).on('click', '#closeEdit', () => show_hide_sidebar())




$(document).on('click', '#editCheck', () => {
    let state = Number($('#editCheck').prop('checked'))
    $(base).find('.check_task').prop('checked', state)
    change_check(goal_id)


    if (state) goal_id = $('.todo').length - 1
    else goal_id = $('#todosArea').children().length - 1
    // let base2 = $('.todo').eq(goal_id)

    base = document.getElementsByClassName("todo")[goal_id] // to change

    console.log(base)
    console.log(base2)
})


$(document).on('blur', '#editText', () => {
    let input = $('#editText').val()

    if ($(base).find('.task').text() !== input) {
        $(base).find('.task').text(input)
        window.goalsAPI.changeTextGoal({input: input, id: Number($(base).find('.goal_id').text())})
    }
})

$(document).on('blur', '.editTextStep', function () {
    const edit_text_step = $('.editTextStep')
    let index = edit_text_step.index(this)
    let input = edit_text_step.eq(index).val()

    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))

    if (!$(base).find('.stepsShow').length) {
        $(base).find('.task_text').append(
            `<div class='stepsShow' style="background: ${categories[category_id][0]}"><img src='images/goals/down.png' alt="up" class="showImg">
                <span class="check_counter">
                    <span class="counter">${0}</span>/<span class="maxCounter">${0}</span>
                </span>
            </div>
            <div class='steps'></div>`)
    }

    if ($(base).find('.step').length < edit_text_step.length) {
        if (input !== "") {
            $(base).find('.steps').append(
                `<div class='step'>
                    <input type='checkbox'  class='stepCheck'> <span class="step_text">${input}</span>
                </div>`)

            let max_counter = $(base).find('.maxCounter')
            max_counter.text(Number(max_counter.text()) + 1)

            window.goalsAPI.addStep({input: input, id: Number($(base).find('.goal_id').text())})
        }
    } else change_step(index, input)
})


function change_step(index, value) {
    if (value !== "") {
        $(base).find('.step_text').eq(index).text(value)
        window.goalsAPI.changeStep({input: value, id: Number($(base).find('.goal_id').text()), step_id: index})
    } else {
        let max_counter_html = $(base).find('.maxCounter')
        let counter_html = $(base).find('.counter')

        max_counter_html.text(Number(max_counter_html.text()) - 1)
        if ($(base).find('.stepCheck').eq(index).prop('checked'))  counter_html.text(Number(counter_html.text()) - 1)

        if ($(base).find('.step').length === 1) {
            $(base).find('.stepsShow').remove()
            $(base).find('.steps').remove()
        } else $(base).find('.step').eq(index).remove()

        $('.editStep').eq(index).remove()

        window.goalsAPI.removeStep({id: Number($(base).find('.goal_id').text()), step_id: index})
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

    window.goalsAPI.changeChecksStep({goal_id: Number($(base).find('.goal_id').text()), step_id: index, state: state})
})

$(document).on('click', '#editNewStep', () => {
    let steps_html = _get_steps_html()

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
    window.goalsAPI.changeCategory({id: Number($(base).find('.goal_id').text()), new_category: category_id})
}


$(document).on('click', '#editDiff', () => {
    let difficulty = $('#editDiff').val()
    let url = `images/goals/rank${difficulty}.svg`
    $('.todoCheck').eq(goal_id).css('backgroundImage', `url("${url}")`)
    window.goalsAPI.changeDifficulty({id: Number($(base).find('.goal_id').text()), difficulty: difficulty})
})



$(document).on('click', '#editImportance', () => {

    let importance = $('#editImportance').val()
    $('.dot').eq(goal_id).css('borderColor', check_border[importance])
    window.goalsAPI.changeImportance({id: Number($(base).find('.goal_id').text()), importance: importance})
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


function _get_steps_html() {
    let steps_html = ""

    if ($(base).find('.step').length > 0) {
        let array = $(base).find('.step')

        for (let i = 0; i < array.length; i++) {
            let check_state = ""
            if (array.eq(i).find('.stepCheck').prop('checked') === true) check_state = "checked"

            steps_html += `
                <div class="editStep">
                    <input type="checkbox" ${check_state} class="editCheckStep"><input type="text" class="editTextStep" value="${array[i].innerText.trim()}" spellcheck="false">
                </div>`
        }
    }
    return steps_html
}


function todo_html() {
    let main_goal = $(base).find('.task_text').text()
    let steps_html = _get_steps_html()

    let check_state = $(base).find('.check_task').prop('checked') === true ? "checked" : "";

    let category_id = getIdByColor(categories, $(base).find('.todoCheck').css('backgroundColor'))
    let difficulty = document.getElementsByClassName("todoCheck")[goal_id].style.backgroundImage[22]//weak point

    let importance = check_border.indexOf($(base).find('.dot').css('borderColor'))

    return `<div id="closeEdit">⨉</div>
        <div id="todoEdit">
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
                <input type="range" class="r_todo" id="editDiff" min="0" max="4" value="${difficulty}">
                <input type="range" class="r_todo" id="editImportance" min="0" max="4" value="${importance}">
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