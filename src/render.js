import {l_date} from './date.js'

let pressed = false
let selected_div = null
let press_state = 0

let current_step = 1
let steps = []

window.goalsAPI.askGoals({date: l_date.sql})
window.goalsAPI.getGoals((data) => data.map((elem) => {
    if (elem.check_state) build_goal(elem.goal.replace("`@`", "'"), "checked")
    else build_goal(elem.goal.replace("`@`", "'"))
}))


window.goalsAPI.removingGoal((event) => {

    if (press_state === 0) {
        window.goalsAPI.goalRemoved({id: $('.todo').index(selected_div), date: l_date.sql})
        selected_div.remove()
    }
})
window.sidebarAPI.removingHistory((event) => {
    if (press_state === 1) {
        window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
        selected_div.remove()
    }
})

window.sidebarAPI.removingIdea((event) => {
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

        window.goalsAPI.newGoal({goal_text: goal_text.replace("'", "`@`")})
        build_goal(goal_text, steps)
        document.getElementById('entry').value = ""
    }
}

function build_goal(goal_text, steps = [], checked = "") {
    let display_steps = ""
    if (steps.length > 0){
        display_steps =
            "<div class='stepsShow'><img src='images/goals/up.png'>0/1</div>" +
            "<div class='steps'>"

        for (let i = 0; i < steps.length; i++) {
            display_steps +=
                "<div class='step'>" +
                "   <input type='checkbox' class='stepCheck'> " + steps[i] +
                "</div>"
        }
        display_steps += "</div>"

        document.getElementById("todosArea").innerHTML +=
            "<div class='todo' onmousedown='press()' onmouseup='unpress()'>" +
            "   <div class='todoCheck'><input type='checkbox' class='check_task' ></div>" +
            "   <div class='task_text'><span class='task'>" + goal_text + "</span>" +display_steps +
            "</div></div>"

        document.getElementById("newSteps").innerHTML = "<div id='newStep'>Step 1</div>"
        document.getElementById("newStep").addEventListener('click', (event) => step_clicked(event))
        current_step = 1

        let steps_show = document.getElementsByClassName("stepsShow")

        for (let i = 0; i < steps_show.length; i++){
            steps_show[i].addEventListener('click', (event) => show_steps(event))
            steps_show[i].parentNode.children[2].style.display = "block"
        }

    }
    else{
        document.getElementById("todosArea").innerHTML +=
            "<div class='todo' onmousedown='press()' onmouseup='unpress()'>" +
            "   <div class='todoCheck'><input type='checkbox' " + checked + " class='check_task' ></div>" +
            "   <div class='task_text'><span class='task'>" + goal_text + "</span></div>" +
            "</div>"
    }
}

function show_steps(event1){
    console.log(event1.target.parentNode.children[2].style.display)
    if(event1.target.parentNode.children[2].style.display === "block"){
        event1.target.parentNode.children[2].style.display = 'none'
    }
    else event1.target.parentNode.children[2].style.display = 'block'
}

function step_clicked(event1) {
    event1.target.remove()
    let array = document.getElementsByClassName('stepEntry')
    steps = []
    for (let i = 0; i < array.length; i++) steps.push(array[i].value)
    document.getElementById("newSteps").innerHTML +=
        "<div id='stepText'>" + current_step + ") <input type='text' class='stepEntry'></div>" +
        "<div id='newStep'>Step " + (current_step + 1) + "</div>"
    document.getElementById("newStep").addEventListener('click', (event) => step_clicked(event))
    current_step += 1

    array = document.getElementsByClassName('stepEntry')
    for (let i = 0; i < array.length - 1; i++) array[i].value = steps[i]
    array[array.length - 1].focus()

}

document.getElementById("newStep").addEventListener('click', (event) => step_clicked(event))

window.addEventListener("DOMContentLoaded", (event) => {
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
            press_state = 1
            if (event.target.classList.contains("sidebarTask")) {
                if (event.target.parentNode.children.length === 1) selected_div = event.target.parentNode.parentNode
                else selected_div = event.target
                pressed = true
            }
        })
    }

})

document.getElementById("img_second").addEventListener('click', () => {
    setTimeout(function () {
        const history = document.getElementById("days")
        const ideas = document.getElementById("ideas")
        if (history) {
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
                if (event.target.classList.contains("task_history")) {
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
    window.goalsAPI.changeChecks({id: id, state: state, date: l_date.sql})
});


document.getElementById("laurels").addEventListener('click', () => {
    window.appAPI.changeWindow()
})

