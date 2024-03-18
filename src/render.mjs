import {l_date} from './date.js'
import {categories, getIdByColor} from "./data.mjs";
import {close_edit, change_category} from "./edit.mjs";

window.addEventListener("DOMContentLoaded", () => {
    build_day_view()
    $('#date').html(l_date.display)
});


window.goalsAPI.askGoals({date: l_date.day_sql})

window.goalsAPI.getGoals((goals, steps) => {
    for (let i = 0; i < goals.length; i++) {
        let goal_steps = []
        let steps_checks = []

        for (let j = 0; j < steps.length; j++) {
            if (goals[i].id === steps[j].goal_id) {
                goal_steps.push(steps[j].step_text)
                steps_checks.push(steps[j].step_check)
            }
        }
        build_goal(goals[i].goal.replace("`@`", "`"), goal_steps, goals[i].category, goals[i].Importance, goals[i].Difficulty, goals[i].check_state, steps_checks)
    }

    let finished_count = $('#todosFinished .todo').length
    $('#finishedButton').css('display', finished_count ? "block" : "none")
    if (finished_count) $("#finishedCount").html(finished_count);

})


$(document).on('click', '#todoInput', (event) => {
    event.stopPropagation()
    $("#todoEntryComplex").css({"height": "250px", "visibility": "visible"});
    $("#todosAll").css({"height": "calc(100% - 315px)"});

})

$(document).on('click', '#main', () => {
    $("#todoEntryComplex").css({"height": "0", "visibility": "hidden"});
    $("#todosAll").css({"height": "calc(100% - 65px)"});
})


$(document).on('click', '#todoAdd', () => new_goal())

$(document).on('keyup', '#todoEntrySimple', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
})


function new_goal() {
    let e_todo = $('#todoEntryGet')
    let goal_text = e_todo.val()

    if (goal_text !== "") {
        let difficulty = $('#range1').val()
        let importance = $('#range2').val()

        let new_category = getIdByColor(categories, $('#selectCategory').css('backgroundColor'))
        let steps = []

        let steps_elements = $('.stepEntry')
        for (let i = 0; i < steps_elements.length; i++) {
            let step_value = steps_elements[i].value
            if (step_value !== "") steps.push(step_value)
        }

        e_todo.val('')
        if (steps.length !== 0) {
            input_count = 0
            $('#newSteps').html(`<div class="newStepText"><input type="text" class="stepEntry" placeholder="Action 1"></div>`)
        }

        build_goal(goal_text, steps, new_category, importance, difficulty)
        window.goalsAPI.newGoal({
            goal_text: goal_text.replace("'", "`@`"),
            steps: steps,
            category: new_category,
            difficulty: difficulty,
            importance: importance,
        })
    }
}


$(document).on('click', '.selectCategory', function (event) {
    event.stopPropagation()
    if ($(this).attr('id') === "selectCategory") $('#categoryPicker').toggle()
    else $('#categoryPicker2').toggle()
});

$(document).on('click', '#main, #todoInput', function () {
    $('#categoryPicker').css('display', 'none')
})

$(document).on('click', '#rightbar', function () {
    $('#categoryPicker2').css('display', 'none')
})

$(document).on('click', '.category', function () {
    let index = $(this).closest('.categoryPicker').find('.category').index(this) + 1
    let select_category = $('#selectCategory')

    if ($(this).closest('.categoryPicker').attr('id') === "categoryPicker2") {
        select_category = $('#selectCategory2')

        change_category(index)
    }

    select_category.css('background', categories[index][0])
    select_category.text(categories[index][1])
});

(function () {
    let backgrounds = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]

    $(document).on('input', '#range1', function () {
        let x = this.value
        $(this).css('background', backgrounds[x])
    })
})();

(function () {
    let backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

    $(document).on('input', '#range2', function () {
        let x = this.value
        $(this).css('background', backgrounds[x])
    })
})();


export function build_goal(goal_text, steps = [], category = 1, importance = 2, difficulty = 2, goal_checked = 0, step_checks = []) {
    let category_color = categories[category][0]

    let check_state = ""
    let todo_area = "todosArea"
    let check_bg = ""
    let check_border = ["#0075FF", "#24FF00", "#FFC90E", "#FF5C00", "#FF0000"]

    if (goal_checked) {
        check_state = "checked"
        todo_area = "todosFinished"
        check_bg = "url('images/goals/check.png')"
    }
    let steps_HTML = ""


    if (steps.length > 0) {
        let checks_counter = 0
        if (step_checks.length !== 0) checks_counter = step_checks.reduce((a, b) => a + b)
        steps_HTML =
            `<div class='stepsShow' style="background: ${category_color}">
                <img class='showImg' src='images/goals/down.png' alt="">
                <span class="check_counter">
                    <span class="counter">${checks_counter}</span>/<span class="maxCounter">${steps.length}</span>
                </span>
            </div>
            <div class='steps'>`

        for (let i = 0; i < steps.length; i++) {
            let step_check = ""
            if (step_checks[i] === 1) step_check = "checked"

            steps_HTML +=
                `<div class='step'>
                    <input type='checkbox' ${step_check} class='stepCheck'> <span class="step_text">${steps[i]}</span>
                </div>`
        }
        steps_HTML += "</div>"
    }


    let url = `images/goals/rank${difficulty}.svg`
    document.getElementById(todo_area).innerHTML +=
        `<div class='todo'>
            <div class="todoId">${$('.todo').length}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px solid ${check_border[importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='taskText'><span class='task'> ${goal_text} </span>${steps_HTML}</div>
        </div>`

    $('.steps:last').css('display', 'block')
}

$(document).on('click', '.stepsShow', (event) => show_steps(event));


let input_count = 0

$(document).on('change', '.stepEntry', function () {
    if ($('.stepEntry').index(this) === input_count) {
        input_count += 1
        $('#newSteps').append(`<div class="newStepText"><input type='text' class='stepEntry' placeholder="Action ${input_count + 1}"></div>`)
        document.getElementsByClassName('stepEntry')[input_count].focus()
    }
});

(function () {
    let selected_div = null
    let is_r_pressed = false
    let r_press_state = 0

    $(document).on('contextmenu', '.todo', function (event) {
        r_press_state = 0
        selected_div = event.target
        is_r_pressed = true
    })

    $(document).on('contextmenu', '.sidebarTask', function (event) {
        selected_div = event.target
        is_r_pressed = true
        if ($(this).parents('.historyTasks').length) r_press_state = 1
        else r_press_state = 2
    })

    window.goalsAPI.removingGoal(() => {
        if (r_press_state === 0) {
            let id = $(selected_div).find('.todoId').text()
            window.goalsAPI.goalRemoved({id: id, date: l_date.day_sql})

            if ($(selected_div).find('.check_task').prop('checked')) {
                let finished_count = $('#todosFinished .todo').length
                if (finished_count === 1) $('#finishedButton').css('display', 'none')
                $('#finishedCount').html(finished_count - 1)
            }
            selected_div.remove()

            let goals = $('.todoId')
            for (let i = 0; i < goals.length; i++) {
                if (goals.eq(i).html() > id) goals.eq(i).html(goals.eq(i).html() - 1)
            }
            close_edit()
        }
    })

    window.sidebarAPI.removingHistory(() => {
        if (r_press_state === 1) {
            window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
            if ($(selected_div).closest('.historyTasks').children().length === 1) {
                selected_div = $(selected_div).closest('.day')
            }
            selected_div.remove()
        }
    })

    window.sidebarAPI.removingIdea(() => {
        if (r_press_state === 2) {
            window.sidebarAPI.ideaRemoved({id: $('.sidebarTask').index(selected_div)})
            selected_div.remove()
        }
    })

    window.oncontextmenu = function () {
        try {
            return is_r_pressed;
        } finally {
            is_r_pressed = false
        }
    }
})();


$(document).on('click', '#todosAll .check_task', function () {
    let id = $('.check_task').index(this)
    change_check(id)
});

export function change_check(id) {
    const check_task = $('.check_task').eq(id)
    const dot = $('.checkDot').eq(id)
    let todo
    let goal_id
    if ($('#monthGrid').length) {
        goal_id = $('.monthTodoId')
        todo = $('.monthTodo')
    }
    else {
        goal_id = $('.todoId')
        todo = $('.todo')
    }

    let array_id = Number(goal_id.eq(id).html())
    let state = Number(check_task.prop('checked'))

    check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task'>`)

    let category_color = $(dot).css('borderColor')
    $(dot).replaceWith(`<div class="checkDot" style="background-image: ${state ? "url('images/goals/check.png')" : ""}; border-color:${category_color}">`)

    todo.eq(id).remove()
    $(state ? "#todosFinished" : "#todosArea").append(todo.eq(id).prop("outerHTML"))

    let new_tasks = goal_id.map(function () {
        return $(this).text();
    }).get()

    window.goalsAPI.changeChecksGoal({id: array_id, state: state})
    if ($('#todosAll').length) window.goalsAPI.rowsChange({after: new_tasks})

    let finished_count = $('#todosFinished .todo').length
    $("#finishedButton").css('display', finished_count ? "block" : "none");
    $('#finishedCount').html(finished_count)
}


$(document).on('click', '.stepCheck', function () {
    const step_check = $('.stepCheck')
    let step_id_rel = $(this).closest('.step').index()
    let goal_id = $(this).closest('.todo').find('.todoId').text()

    let step_id_unrel = step_check.index(this)
    let counter_html = $(this).closest(".todo").find('.counter').get(0)
    if (this.checked) {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) + 1
    } else {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({id: goal_id, step_id: step_id_rel, state: Number(this.checked)})
});

$(document).on('click', '#finishedButton', () => {
    const finished_img = $('#finishedImg')
    let show = finished_img.attr('src') === "images/goals/up.png"
    $('#todosFinished').css('display', show ? "block" : "none")
    finished_img.attr('src', show ? "images/goals/down.png" : "images/goals/up.png")
})


export function show_steps(event1) {
    const steps = $(event1.target).closest(".taskText").find('.steps')
    let show = steps.css("display") === "block"
    steps.css("display", show ? 'none' : 'block')
    $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
}


$(document).on('click', '.viewOption', function () {
    $('.viewOption').css('borderColor', "black")
    $(this).css('borderColor', "#FFC90E")
})

$(document).on('click', '#viewDay', function () {
    day_view()
})

export function day_view() {
    $('#content').css('flexDirection', 'column')

    $('#todayButton .dateButtonText').text('Today')
    $('#tomorrowButton .dateButtonText').text('Tomorrow')
    $('#otherButton .dateButtonText').text('Another day')

    build_day_view()

    l_date.fix_header_day()
    window.sidebarAPI.askHistory({date: l_date.day_sql})
    window.goalsAPI.askGoals({date: l_date.day_sql})
}


export function dragula_day_view() {
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])

    dragula(dragula_array, {
        copy: function (el) {
            return el.className === "sidebarTask";
        },
        accepts: function (el, target) {
            return target.className !== "historyTasks";
        }
    }).on('drag', function (event) {
        drag_sidebar_task = $(event)
    }).on('drop', function (event) {
        if (event.className.includes("todo")) _change_order()
        else if (event.parentNode !== null) _get_from_sidebar(drag_sidebar_task)
    });
}

function _change_order() {
    let goals = $('.todoId')
    let order = []
    for (let i = 0; i < goals.length - 1; i++) order.push(goals.eq(i).text())
    window.goalsAPI.rowsChange({after: order})
}

function _get_from_sidebar(drag_sidebar_task) {
    let new_goal_pos = 0;
    let todos = $('#todosArea').children()

    for (let i = 0; i < todos.length; i++) if (todos[i].className !== "todo") new_goal_pos = i

    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: l_date.day_sql})

    if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
    else drag_sidebar_task.closest('.day').remove()
}


function build_day_view() {
    let categories_html = _build_categories()

    let html = `
        <div id="todosAll">
            <div id="todosArea">

            </div>
            <div id="finishedButton">
                <img id="finishedImg" src="images/goals/down.png" alt="up"><span>Finished: </span><span
                    id="finishedCount">0</span>
            </div>
            <div id="todosFinished">

            </div>
        </div>
        <div id="todoInput">
            <div id="todoEntrySimple">
                <input id="todoEntryGet" type="text" spellcheck="false" placeholder="Result">
                <div id="todoAdd">+</div>
            </div>
            <div id="todoEntryComplex">
                <div id="newSteps">
                    <div class="newStepText"><input type="text" class="stepEntry" placeholder="Action 1"></div>
                </div>
                <div id="todoSettings">
                    <div class="todoLabel">Category</div>
                    <div id="selectCategory" class="selectCategory">None</div>
                    <div class="todoLabel" id="label1">Difficulty</div>
                    <input type="range" class="todoRange" id="range1" min="0" max="4">
                    <div class="todoLabel" id="label2">Importance</div>
                    <input type="range" class="todoRange" id="range2" min="0" max="4">

                    <div class="categoryPicker" id="categoryPicker">
                        ${categories_html}
                    </div>
                </div>
                </div>
            </div>
    `
    $('#content').html(html)
}

export function _build_categories(){
    let categories_html = ""
    for (let i = 0; i < Object.keys(categories).length; i++){
        categories_html +=
            `<div class="category">
                <span class="categoryButton" style="background: ${categories[i+1][0]}"></span>
                <span class="categoryName">${categories[i+1][1]}</span>
            </div>`
    }
    return categories_html
}
// document.getElementById("laurels").addEventListener('click', () => {
//     window.appAPI.changeWindow()
// })
