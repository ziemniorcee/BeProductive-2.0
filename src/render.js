import {l_date} from './date.js'

let goals_len = 0;
let data = {};
let pressed = false
let selected_div = null
let tasks = []
let checks = []

let todo_length = 0


window.electronAPI.getData({date: l_date.sql}) // This calls the exposed method from the preload script
window.electronAPI.receiveData((data) => {
    todo_length = data.length
    let nameString = data.map((elem) => {
        return load_goals(elem.goal, elem.check_state)
    })
})
window.electronAPI3.delete_task((event) => {
    selected_div.remove()
    let elements = document.getElementsByClassName("task")
    let elements_checks = document.getElementsByClassName("check_task")
    tasks = []
    checks = []
    for(let i = 0; i < elements.length; i++){
        tasks.push(elements[i].textContent)
        checks.push(Number(elements_checks[i].checked))
    }

    window.electronAPI5.sendId({tasks: tasks, checks:checks, date: l_date.sql})
})

document.getElementById("add").addEventListener('click', () => {
    new_goal()
})


function load_goals(text, check) {
    text = text.replace("`@`", "'")
    let state = ""
    if (check) {
        document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox' checked class='check_task' ><div class='task_text'><span class='task'>" + text + "</span></div></div>"
    } else {
        document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox' class='check_task' ><div class='task_text'><span class='task'>" + text + "</span></div></div>"

    }
    tasks.push(text)
    checks.push(check)
}

function new_goal() {
    let goal_text = document.getElementById('entry').value

    if (goal_text !== "") {
        let text = goal_text.replace("'", "`@`")
        window.electronAPI2.sendData({goal_text: text, date: l_date.sql})
        document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox'  class='check_task' ><div class='task_text'><span class='task'>" + goal_text + "</span></div></div>"
        document.getElementById('entry').value = ""
        tasks.push(goal_text)
        checks.push(0)
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    document.getElementById("date").innerHTML = l_date.display
    const el = document.getElementById('dragparent');
    if (el) {
        el.addEventListener('contextmenu', function handleClick(event) {
            if (event.target.classList.contains("dragthing")) {
                selected_div = event.target
                pressed = true
            }
            if (event.target.classList.contains("task")) {
                selected_div = event.target.parentNode.parentNode
                pressed = true
            }
        })
    }
})


window.oncontextmenu = function () {
    try {
        return pressed;
    } finally {
        pressed = false
    }
}


$("#entry").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        new_goal()
    }
});

$(document).on('click', '.check_task', function () {
    let elements = document.getElementsByClassName("check_task")
    let array = []
    for (let i = 0; i < elements.length; i++) {
        array.push(Number(elements[i].checked))
    }
    window.electronAPI6.sendChecks({checks: array})
});