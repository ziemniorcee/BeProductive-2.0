import {l_date} from './date.js'
import {categories, getIdByColor} from "./data.mjs";
import {close_edit, change_category} from "./edit.mjs";

window.addEventListener("DOMContentLoaded", () => {
    $('#date').html(l_date.display)
    select_category()
});


window.goalsAPI.askGoals({date: l_date.sql})

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
        build_goal(goals[i].goal, goal_steps, goals[i].category, goals[i].Importance, goals[i].Difficulty, goals[i].check_state, steps_checks)
    }

    let finished_count = $('#todosFinished .todo').length
    $('#buttonFinished').css('display', finished_count ? "block" : "none")
    if (finished_count) $("#finishedCount").html(finished_count);
})


$(document).on('click', '#inputTodo', (event) => {
    event.stopPropagation()
    $("#entry2").css({"height": "250px", "visibility": "visible"});
})

$(document).on('click', '#main', () => {
    $("#entry2").css({"height": "0", "visibility": "hidden"});
})


$(document).on('click', '#todoAdd', () => new_goal())

$(document).on('keyup', '#entry1', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
})


function new_goal() {
    let e_todo = $('#e_todo')
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
            $('#newSteps').replaceWith(
                `<div id="newSteps" style="overflow-y: hidden;">
                <div class="stepText"><input type="text" class="stepEntry" placeholder="Action 1"></div></div>`
            )
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


export function select_category(option = "") {
    let displays = ["none", "block"]
    let show = false
    let category_button = $(`#selectCategory${option}`)
    let category_display = $(`#categoryPicker${option}`)

    category_button.on('click', () => {
        show = category_display.css('display') === "" || category_display.css('display') === "none";
        category_display.css('display', displays[Number(show)])
        if (show === true) {
            $(document).on('click', '.category', function () {
                let i = category_display.find('.category').index(this)
                category_button.text($('.categoryName').eq(i).text())
                category_button.css('background', categories[i + 1][0])
                if (option !== "") change_category()
            })
        }
    })
}

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
        `<div class='todo' onmousedown='press()' onmouseup='unpress()'>
            <div class="goal_id">${$('.todo').length}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="dot" style="background-image: ${check_bg}; border: 2px solid ${check_border[importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='task_text'><span class='task'> ${goal_text} </span>${steps_HTML}</div>
        </div>`

    $('.steps:last').css('display', 'block')
}

$(document).on('click', '.stepsShow', (event) => show_steps(event));

(function () {
    let input_count = 0
    new_step()

    function new_step() {
        $('#newSteps').append(`<div class="stepText"><input type='text' class='stepEntry' placeholder="Action ${input_count + 1}"></div>`)

        let entry = $('.stepEntry')

        entry.change(function () {
            if (entry.index(this) === input_count) {
                input_count += 1
                new_step()
                document.getElementsByClassName('stepEntry')[input_count].focus()
            }
        })
    }
})();


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
        if ($(this).parents('.tasks_history').length) r_press_state = 1
        else r_press_state = 2
    })

    window.goalsAPI.removingGoal(() => {
        if (r_press_state === 0) {
            let id = $(selected_div).find('.goal_id').text()
            window.goalsAPI.goalRemoved({id: id, date: l_date.sql})

            if ($(selected_div).find('.check_task').prop('checked')) {
                let finished_count = $('#todosFinished .todo').length
                if (finished_count === 1) $('#buttonFinished').css('display', 'none')
                $('#finishedCount').html(finished_count - 1)
            }
            selected_div.remove()

            let goals = $('.goal_id')
            for (let i = 0; i < goals.length; i++) {
                if (goals.eq(i).html() > id) goals.eq(i).html(goals.eq(i).html() - 1)
            }
            close_edit()
        }
    })

    window.sidebarAPI.removingHistory(() => {
        if (r_press_state === 1) {
            window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
            if ($(selected_div).closest('.tasks_history').children().length === 1) {
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


$(document).on('click', '.check_task', function () {
    let id = $('.check_task').index(this)
    change_check(id)
});

export function change_check(id) {
    const check_task = $('.check_task').eq(id)
    const dot = $('.dot').eq(id)
    const todo = $('.todo')
    const goal_id = $('.goal_id')

    let array_id = Number(goal_id.eq(id).html())
    let state = Number(check_task.prop('checked'))

    check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task'>`)

    let category_color = $(dot).css('borderColor')
    $(dot).replaceWith(`<div class="dot" style="background-image: ${state ? "url('images/goals/check.png')" : ""}; border-color:${category_color}">`)

    todo.eq(id).remove()
    $(state ? "#todosFinished" : "#todosArea").append(todo.eq(id).prop("outerHTML"))

    let new_tasks = goal_id.map(function () {
        return $(this).text();
    }).get()

    window.goalsAPI.changeChecksGoal({id: array_id, state: state})
    window.goalsAPI.rowsChange({after: new_tasks})

    let finished_count = $('#todosFinished .todo').length
    $("#buttonFinished").css('display', finished_count ? "block" : "none");
    $('#finishedCount').html(finished_count)
}


$(document).on('click', '.stepCheck', function () {
    const step_check = $('.stepCheck')
    let step_id_rel = $(this).closest('.step').index()
    let goal_id = $(this).closest('.todo').find('.goal_id').text()

    let step_id_unrel = step_check.index(this)
    let counter_html = $(this).closest(".todo").find('.counter').get(0)
    if (this.checked) {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) + 1
    } else {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({goal_id: goal_id, step_id: step_id_rel, state: Number(this.checked)})
});

$(document).on('click', '#buttonFinished', () => {
    const finished_img = $('#finishedImg')
    let show = finished_img.attr('src') === "images/goals/up.png"
    $('#todosFinished').css('display', show ? "block" : "none")
    finished_img.attr('src', show ? "images/goals/down.png" : "images/goals/up.png")
})


export function show_steps(event1) {
    const steps = $(event1.target).closest(".task_text").find('.steps')
    let show = steps.css("display") === "block"
    steps.css("display", show ? 'none' : 'block')
    $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
}


// document.getElementById("laurels").addEventListener('click', () => {
//     window.appAPI.changeWindow()
// })
