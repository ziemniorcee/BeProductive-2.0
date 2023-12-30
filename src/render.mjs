import {l_date} from './date.js'

let current_id = 0

let pressed = false
let selected_div = null
let press_state = 0

let current_step = 1
let steps = []

export function xdd(){
    console.log("dziala")
}
window.goalsAPI.askGoals({date: l_date.sql})

window.goalsAPI.getGoals((goals, steps) => {
    current_id = 0
    for (let i = 0; i < goals.length; i++) {
        let goal_steps = []
        let steps_checks = []

        for (let j = 0; j < steps.length; j++) {
            if (goals[i].id === steps[j].goal_id) {
                goal_steps.push(steps[j].step_text)
                steps_checks.push(steps[j].step_check)
            }
        }
        build_goal(goals[i].goal, goal_steps, goals[i].check_state, steps_checks)
    }
})


window.goalsAPI.removingGoal(() => {
    if (press_state === 0) {

        window.goalsAPI.goalRemoved({id: $('.todo').index(selected_div), date: l_date.sql})
        selected_div.remove()
        let goals = document.getElementsByClassName("goal_id")
        for (let i = 0; i < goals.length; i++) goals[i].innerHTML = i
        current_id--
    }
})
window.sidebarAPI.removingHistory(() => {
    if (press_state === 1) {
        window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
        selected_div.remove()
    }
})

window.sidebarAPI.removingIdea(() => {
    if (press_state === 2) {
        window.sidebarAPI.ideaRemoved({id: $('.sidebarTask').index(selected_div)})
        selected_div.remove()
    }
})

document.getElementById("todoAdd").addEventListener('click', () => new_goal())

document.getElementById("todoHide").addEventListener('click', () => {
    document.getElementById("entry_bg").style.height = "50px"
    document.getElementById("todo_buttons").style.height = "50px"
})

$("#entry").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});

document.getElementById("entry").addEventListener('click', () => {
    document.getElementById("entry_bg").style.height = "300px"
    document.getElementById("todo_buttons").style.height = "110px"
})

function new_goal() {
    let goal_text = document.getElementById('entry').value

    if (goal_text !== "") {
        let steps = []
        let steps_elements = document.getElementsByClassName("stepEntry")
        for (let i = 0; i < steps_elements.length; i++) {
            let step_value = steps_elements[i].value
            if (step_value !== "") steps.push(step_value)
        }
        build_goal(goal_text, steps)
        window.goalsAPI.newGoal({goal_text: goal_text.replace("'", "`@`"), steps: steps})

        document.getElementById('entry').value = ""
    }
}

export function build_goal(goal_text, steps = [], goal_checked = 0, step_checks = []) {
    let check_state = ""
    if (goal_checked === 1) check_state = "checked"
    let steps_HTML = ""

    if (steps.length > 0) {
        let checks_counter = 0
        if (step_checks.length !== 0) checks_counter = step_checks.reduce((a, b) => a + b)
        steps_HTML =
            `<div class='stepsShow'>
                <img src='images/goals/up.png'>
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

        if (current_step > 1) {
            document.getElementById("newSteps").innerHTML = "<div id='newStep'>Step 1</div>"
            document.getElementById("newStep").addEventListener('click', (event) => new_step(event))
            current_step = 1
        }

    }
    document.getElementById("todosArea").innerHTML +=
        `<div class='todo' onmousedown='press()' onmouseup='unpress()'>
            <div class="goal_id">${current_id}</div>
            <div class='todoCheck'><input type='checkbox' class='check_task' ${check_state}></div>
            <div class='task_text'><span class='task'> ${goal_text} </span>${steps_HTML}</div>
        </div>`

    current_id++

    let steps_show = document.getElementsByClassName("stepsShow")
    for (let i = 0; i < steps_show.length; i++) {
        steps_show[i].addEventListener('click', (event) => show_steps(event))
        steps_show[i].parentNode.children[2].style.display = "block"
    }
}

export function show_steps(event1) {
    if (event1.target.parentNode.children[2].style.display === "block") {
        event1.target.parentNode.children[2].style.display = 'none'
        event1.target.parentNode.children[1].children[0].src = 'images/goals/down.png'
    } else {
        event1.target.parentNode.children[2].style.display = 'block'
        event1.target.parentNode.children[1].children[0].src = 'images/goals/up.png'
    }
}

function new_step(event1) {
    event1.target.remove()
    let array = document.getElementsByClassName('stepEntry')
    steps = []
    for (let i = 0; i < array.length; i++) steps.push(array[i].value)

    document.getElementById("newSteps").innerHTML +=
        `<div id='stepText'> ${current_step}) <input type='text' class='stepEntry'></div>
        <div id='newStep'>Step ${current_step + 1} </div>`


    document.getElementById("newStep").addEventListener('click', (event) => new_step(event))
    current_step += 1

    array = document.getElementsByClassName('stepEntry')
    for (let i = 0; i < array.length - 1; i++) array[i].value = steps[i]
    array[array.length - 1].focus()
}

document.getElementById("newStep").addEventListener('click', (event) => new_step(event))

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("date").innerHTML = l_date.display
    const goals = document.getElementById('todosArea');
    const history = document.getElementById("days")
    if (goals) {
        goals.addEventListener('contextmenu', function handleClick(event) {
            press_state = 0
            if (event.target.classList.contains("todo")) {
                selected_div = event.target
                pressed = true
            }
            if (event.target.classList.contains("task")) {
                selected_div = event.target.parentNode.parentNode
                pressed = true
            }
        })
    }

    if (history) {
        history.addEventListener('contextmenu', function handleClick(event) {
            if (document.getElementById("ideas") === null) {
                press_state = 1
                if (event.target.classList.contains("sidebarTask")) {
                    if (event.target.parentNode.children.length === 1) selected_div = event.target.parentNode.parentNode
                    else selected_div = event.target
                    pressed = true
                }
            }

        })
    }

})

document.getElementById("img_second").addEventListener('click', () => {
    setTimeout(function () {
        const history = document.getElementById("days")
        const ideas = document.getElementById("ideas")
        if (history && !ideas) {
            history.addEventListener('contextmenu', function handleClick(event) {
                press_state = 1
                if (event.target.classList.contains("task_history")) {
                    selected_div = event.target
                    pressed = true
                }
            })
        }

        if (ideas) {
            ideas.addEventListener('contextmenu', function handleClick(event) {
                press_state = 2
                if (event.target.classList.contains("sidebarTask")) {
                    selected_div = event.target
                    pressed = true
                }
            })
        }

    }, 1)
})

window.oncontextmenu = function () {
    try {
        return pressed;
    } finally {
        pressed = false
    }
}


$(document).on('click', '.check_task', function () {
    let id = $('.check_task').index(this)
    let state = Number(document.getElementsByClassName("check_task")[id].checked)
    if (state) {
        document.getElementsByClassName("check_task")[id].outerHTML =
            "<input type='checkbox' checked class='check_task'>"
    } else {
        document.getElementsByClassName("check_task")[id].outerHTML =
            "<input type='checkbox' class='check_task'>"
    }
    window.goalsAPI.changeChecksGoal({id: id, state: state})
});

$(document).on('click', '.stepCheck', function () {
    let step_id_unrel = $('.stepCheck').index(this)

    let step_id_rel = 0
    let goal_id = Number(this.parentNode.parentNode.parentNode.parentNode.children[0].innerHTML)

    for (let i = 0; i < this.parentNode.parentNode.children.length; i++) {
        if (this.parentNode.parentNode.children[i] === this.parentNode) {
            step_id_rel = i
            break
        }
    }

    let state = Number(document.getElementsByClassName("stepCheck")[step_id_unrel].checked)
    let counter_html = this.parentNode.parentNode.parentNode.children[1].children[1].children[0]

    if (state) {
        document.getElementsByClassName("stepCheck")[step_id_unrel].outerHTML =
            "<input type='checkbox' checked class='stepCheck'>"
        counter_html.innerText = Number(counter_html.innerText) + 1

    } else {
        document.getElementsByClassName("stepCheck")[step_id_unrel].outerHTML =
            "<input type='checkbox' class='stepCheck'>"
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({goal_id: goal_id, step_id: step_id_rel, state: state})
});

document.getElementById("laurels").addEventListener('click', () => {
    window.appAPI.changeWindow()
})




