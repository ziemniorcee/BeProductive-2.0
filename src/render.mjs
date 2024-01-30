import {l_date} from './date.js'
import {close_edit} from "./edit.mjs";

export let categories = {1: "#3B151F", 2: "#32174D", 3: "#002244", 4: "#023020"}
export let current_id = 0

let r_pressed = false
let selected_div = null
let press_state = 0
let max_pos = 0;

let finished_count = 0

let new_category = 1


window.goalsAPI.askGoals({date: l_date.sql})

window.goalsAPI.getGoals((goals, steps) => {
    current_id = 0
    finished_count = 0
    new_category = 1

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
    if (finished_count) {
        document.getElementById("buttonFinished").style.display = "block"
        document.getElementById("finishedCount").innerHTML = finished_count
    } else {
        document.getElementById("buttonFinished").style.display = "none"
    }
})


window.goalsAPI.removingGoal(() => {
    if (press_state === 0) {
        let id = Number(document.getElementsByClassName("goal_id")[$('.todo').index(selected_div)].innerHTML)
        window.goalsAPI.goalRemoved({id: id, date: l_date.sql})
        if (selected_div.parentNode === document.getElementById("todosFinished")) {
            finished_count--
            if (finished_count) document.getElementById("buttonFinished").style.display = "block"
            else document.getElementById("buttonFinished").style.display = "none"
            document.getElementById("finishedCount").innerHTML = finished_count
        }
        selected_div.remove()
        let goals = document.getElementsByClassName("goal_id")
        for (let i = 0; i < goals.length; i++) {
            if (goals[i].innerHTML > id) goals[i].innerHTML = Number(goals[i].innerHTML) - 1

        }
        current_id--
        close_edit()
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


document.getElementById("entry1").addEventListener('click', () => {
    document.getElementById("entry2").style.display = "flex"
})

function new_goal() {
    let goal_text = document.getElementById('e_todo').value
    let importance = Math.floor(document.getElementById("range2").value / 20)
    let difficulty = Math.floor(document.getElementById("range1").value / 20)

    if (goal_text !== "") {
        let steps = []
        let steps_elements = document.getElementsByClassName("stepEntry")
        for (let i = 0; i < steps_elements.length; i++) {
            let step_value = steps_elements[i].value
            if (step_value !== "") steps.push(step_value)
        }
        build_goal(goal_text, steps, new_category, importance, difficulty)
        window.goalsAPI.newGoal({
            goal_text: goal_text.replace("'", "`@`"),
            steps: steps,
            category: new_category,
            difficulty: difficulty,
            importance: importance,
        })
        document.getElementById('e_todo').value = ""
    }
}


document.getElementById("todoAdd").addEventListener('click', () => new_goal());

(function () {

    let show = false
    let displays = ["none", "block"]

    document.getElementById("selectCategory").addEventListener('click', () => {
        show = !show
        document.getElementById("categoryPicker").style.display = displays[Number(show)]
        if (show === true) {
            let array = document.getElementsByClassName("category")
            for (let i = 0; i < array.length; i++) {
                array[i].addEventListener('click', (event) => {
                    let text = document.getElementsByClassName("categoryName")[i].innerHTML
                    new_category = i + 1
                    document.getElementById("selectCategory").innerText = text;
                    document.getElementById("selectCategory").style.background = categories[new_category];
                })
            }
        }
    })
})();



(function () {
    let backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FFF200", "#ED1C24"]
    document.getElementById("range2").oninput = function () {
        let x = Math.floor(document.getElementById("range2").value / 20)

        document.getElementById("range2").style.background = backgrounds[x]
    }
})();

$("#entry").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});


export function build_goal(goal_text, steps = [], category, importance = 2, difficulty = 2, goal_checked = 0, step_checks = [] = "") {
    let category_color = categories[category]
    let check_state = ""
    let todo_area = "todosArea"
    let check_bg = ""
    let check_border = ["#0075FF", "#24FF00", "#FFC90E", "#FF5C00", "#FF0000"]
    if (goal_checked) {
        check_state = "checked"
        todo_area = "todosFinished"
        finished_count++
        check_bg = "url('images/goals/check.png')"
    }
    let steps_HTML = ""


    if (steps.length > 0) {
        let checks_counter = 0
        if (step_checks.length !== 0) checks_counter = step_checks.reduce((a, b) => a + b)
        steps_HTML =
            `<div class='stepsShow' style="background: ${category_color}">
                <img src='images/goals/down.png'>
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
            <div class="goal_id">${current_id}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="dot" style="background-image: ${check_bg}; border: 2px solid ${check_border[importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='task_text'><span class='task'> ${goal_text} </span>${steps_HTML}</div>
        </div>`
    current_id++

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
                }
            }
        })
    }
})();

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("date").innerHTML = l_date.display
    const goals = document.getElementById('todosArea');
    const finished = document.getElementById('todosFinished');
    const history = document.getElementById("days")
    goals.addEventListener('contextmenu', function handleClick(event) {
        remove_goal(event)
    })
    finished.addEventListener('contextmenu', function handleClick(event) {
        remove_goal(event)

    })


    if (history) {
        history.addEventListener('contextmenu', function handleClick(event) {
            if (document.getElementById("ideas") === null) {
                press_state = 1
                if (event.target.classList.contains("sidebarTask")) {
                    if (event.target.parentNode.children.length === 1) selected_div = event.target.parentNode.parentNode
                    else selected_div = event.target
                    r_pressed = true
                }
            }
        })
    }
});

function remove_goal(event) {
    press_state = 0
    if (event.target.classList.contains("todo")) {
        selected_div = event.target
        r_pressed = true
    }
    if (event.target.classList.contains("task")) {
        selected_div = event.target.parentNode.parentNode
        r_pressed = true
    }
}

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

document.getElementById("img_second").addEventListener('click', () => {
    setTimeout(function () {
        const history = document.getElementById("days")
        const ideas = document.getElementById("ideas")
        if (history && !ideas) {
            history.addEventListener('contextmenu', function handleClick(event) {
                press_state = 1
                if (event.target.classList.contains("task_history")) {
                    selected_div = event.target
                    r_pressed = true
                }
            })
        }

        if (ideas) {
            ideas.addEventListener('contextmenu', function handleClick(event) {
                press_state = 2
                if (event.target.classList.contains("sidebarTask")) {
                    selected_div = event.target
                    r_pressed = true
                }
            })
        }
    }, 1)
})

window.oncontextmenu = function () {
    try {
        return r_pressed;
    } finally {
        r_pressed = false
    }
}


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

    if (state) finished_count++
    else finished_count--

    if (finished_count) document.getElementById("buttonFinished").style.display = "block"
    else document.getElementById("buttonFinished").style.display = "none"

    document.getElementById("finishedCount").innerHTML = finished_count
}

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


export function show_steps(event1) {
    if (event1.target.parentNode.children[2].style.display === "block") {
        event1.target.parentNode.children[2].style.display = 'none'
        event1.target.parentNode.children[1].children[0].src = 'images/goals/up.png'
    } else {
        event1.target.parentNode.children[2].style.display = 'block'
        event1.target.parentNode.children[1].children[0].src = 'images/goals/down.png'
    }
}

document.getElementById("laurels").addEventListener('click', () => {
    window.appAPI.changeWindow()
})




