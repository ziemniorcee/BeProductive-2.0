import {l_date} from './date.js'
import {categories, getIdByColor} from "./data.mjs";
import {close_edit, change_category} from "./edit.mjs";


window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("date").innerHTML = l_date.display
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
    let finished_count = document.getElementById("todosFinished").getElementsByClassName("todo").length

    if (finished_count) {
        document.getElementById("buttonFinished").style.display = "block"
        document.getElementById("finishedCount").innerHTML = finished_count
    } else {
        document.getElementById("buttonFinished").style.display = "none"
    }
})


$(document).on('click', '#inputTodo', function () {// weak point
    document.getElementById("entry2").style.height = "250px"
    document.getElementById("entry2").style.visibility = "visible"
})

document.getElementById("main").addEventListener('click', () => {
    document.getElementById("entry2").style.height = "0"
    document.getElementById("entry2").style.visibility = "hidden"
})


document.getElementById("todoAdd").addEventListener('click', () => new_goal());

$("#entry1").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});

function new_goal() {
    let goal_text = document.getElementById('e_todo').value

    if (goal_text !== "") {
        let importance = document.getElementById("range2").value
        let difficulty = document.getElementById("range1").value
        let new_category = getIdByColor(categories, document.getElementById("selectCategory").style.backgroundColor)
        let steps = []

        let steps_elements = document.getElementsByClassName("stepEntry")
        for (let i = 0; i < steps_elements.length; i++) {
            let step_value = steps_elements[i].value
            if (step_value !== "") steps.push(step_value)
        }

        document.getElementById('e_todo').value = ""
        if (steps.length !== 0) {
            document.getElementById("newSteps").outerHTML = `<div id="newSteps" style="overflow-y: hidden;">
                <div class="stepText"><input type="text" class="stepEntry" placeholder="Action 1"></div></div>`
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
    let category_button = document.getElementById(`selectCategory${option}`)
    let category_display = document.getElementById(`categoryPicker${option}`)

    category_button.addEventListener('click', () => {
        show = category_display.style.display === "" || category_display.style.display === "none";
        category_display.style.display = displays[Number(show)]
        if (show === true) {
            let array = category_display.getElementsByClassName("category")
            for (let i = 0; i < array.length; i++) {
                array[i].addEventListener('click', () => {
                    category_button.innerText = category_display.getElementsByClassName("categoryName")[i].innerHTML;
                    category_button.style.background = categories[i + 1][0];
                    if (option !== "") change_category()
                })
            }
        }
    })
}

(function () {
    let backgrounds = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]
    document.getElementById("range1").oninput = function () {
        let x = document.getElementById("range1").value
        document.getElementById("range1").style.background = backgrounds[x]
    }
})();

(function () {
    let backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]
    document.getElementById("range2").oninput = function () {
        let x = document.getElementById("range2").value
        document.getElementById("range2").style.background = backgrounds[x]
    }
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
                <img src='images/goals/down.png' alt="">
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

    let current_id = document.getElementsByClassName("todo").length

    let url = `images/goals/rank${difficulty}.svg`
    document.getElementById(todo_area).innerHTML +=
        `<div class='todo' onmousedown='press()' onmouseup='unpress()'>
            <div class="goal_id">${current_id}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="dot" style="background-image: ${check_bg}; border: 2px solid ${check_border[importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='task_text'><span class='task'> ${goal_text} </span>${steps_HTML}</div>
        </div>`

    let steps_show = document.getElementById(todo_area).getElementsByClassName("stepsShow")

    if (steps_HTML !== "") {
        steps_show[steps_show.length - 1].parentNode.children[2].style.display = "block"
    }
    for (let i = 0; i < steps_show.length; i++) {
        steps_show[i].addEventListener('click', (event) => show_steps(event))
    }
}


(function () {
    let input_count = 0
    new_step()


    function new_step() {
        let array = document.getElementsByClassName('stepEntry')
        let steps = []
        for (let i = 0; i < array.length; i++) steps.push(array[i].value)

        document.getElementById("newSteps").innerHTML +=
            `<div class="stepText"><input type='text' class='stepEntry' placeholder="Action ${input_count + 1}"></div>`

        array = document.getElementsByClassName('stepEntry')
        for (let i = 0; i < array.length - 1; i++) array[i].value = steps[i]

        let entry = $('.stepEntry')

        entry.change(function () {
            if (entry.index(this) === input_count) {
                if (event.target.value === "") {
                } else {
                    input_count += 1
                    new_step()
                    document.getElementsByClassName('stepEntry')[input_count].focus()
                }
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
            let id = selected_div.getElementsByClassName("goal_id")[0].innerText
            window.goalsAPI.goalRemoved({id: id, date: l_date.sql})

            if (selected_div.getElementsByClassName('check_task')[0].checked) {
                selected_div.remove()
                let finished_count = document.getElementById("todosFinished").getElementsByClassName("todo").length
                if (!finished_count) document.getElementById("buttonFinished").style.display = "none"
                document.getElementById("finishedCount").innerHTML = finished_count
            }

            let goals = document.getElementsByClassName("goal_id")
            for (let i = 0; i < goals.length; i++) {
                if (goals[i].innerHTML > id) goals[i].innerText = goals[i].innerText - 1
            }
            close_edit()
        }
    })

    window.sidebarAPI.removingHistory(() => {
        if (r_press_state === 1) {
            window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
            if (selected_div.parentNode.children.length === 1) {
                selected_div = selected_div.parentNode.parentNode
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
    let areas = ["todosArea", "todosFinished"]
    let checks = ["", "checked"]
    let check_bg = ["", "url('images/goals/check.png')"]

    let array_id = Number(document.getElementsByClassName("goal_id")[id].innerHTML)
    let state = Number(document.getElementsByClassName("check_task")[id].checked)

    document.getElementsByClassName("check_task")[id].outerHTML =
        `<input type='checkbox' ${checks[state]} class='check_task'>`
    let category_color = document.getElementsByClassName("dot")[id].style.borderColor
    document.getElementsByClassName("dot")[id].outerHTML =
        `<div class="dot" style="background-image: ${check_bg[state]}; border-color:${category_color}">`

    let todo = document.getElementsByClassName("todo")[id].outerHTML
    document.getElementsByClassName("todo")[id].remove()
    document.getElementById(areas[state]).innerHTML += todo

    let steps_show = document.getElementById(areas[state]).getElementsByClassName("stepsShow")

    for (let i = 0; i < steps_show.length; i++) {
        steps_show[i].addEventListener('click', (event) => show_steps(event))
    }

    window.goalsAPI.changeChecksGoal({id: array_id, state: state})

    let elements = document.getElementsByClassName("goal_id")
    let new_tasks = []
    for (let i = 0; i < elements.length; i++) {
        new_tasks.push(elements[i].textContent)
    }
    window.goalsAPI.rowsChange({after: new_tasks})

    let finished_count = document.getElementById("todosFinished").getElementsByClassName("todo").length

    if (finished_count) document.getElementById("buttonFinished").style.display = "block"
    else document.getElementById("buttonFinished").style.display = "none"

    document.getElementById("finishedCount").innerHTML = finished_count
}


$(document).on('click', '.stepCheck', function () {
    let step_id_rel = $(this).closest('.step').index()
    let goal_id = $(this).closest('.todo').find('.goal_id').text()

    let step_id_unrel = $('.stepCheck').index(this)
    let counter_html = $(this).closest(".todo").find('.counter').get(0)
    if (this.checked) {
        document.getElementsByClassName("stepCheck")[step_id_unrel].outerHTML =
            "<input type='checkbox' checked class='stepCheck'>"
        counter_html.innerText = Number(counter_html.innerText) + 1
    } else {
        document.getElementsByClassName("stepCheck")[step_id_unrel].outerHTML =
            "<input type='checkbox' class='stepCheck'>"
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({goal_id: goal_id, step_id: step_id_rel, state: Number(this.checked)})
});


(function () {
    let show = true
    let styles = ["none", "block"]
    let images = ["images/goals/up.png", "images/goals/down.png"]

    document.getElementById("buttonFinished").addEventListener('click', () => {
        show = !show
        document.getElementById("todosFinished").style.display = styles[Number(show)]
        document.getElementById("finishedImg").src = images[Number(show)]
    })
})();


export function show_steps(event1) {
    if (event1.target.parentNode.children[2].style.display === "block") {
        event1.target.parentNode.children[2].style.display = 'none'
        event1.target.children[0].src = 'images/goals/up.png'
    } else {
        event1.target.parentNode.children[2].style.display = 'block'
        event1.target.children[0].src = 'images/goals/down.png'
    }
}


document.getElementById("laurels").addEventListener('click', () => {
    window.appAPI.changeWindow()
})
