import {l_date} from './date.js'

let goals_len = 0;
let data = {};
let pressed = false
let selected_div = null
let tasks = []

let todo_length = 0


window.electronAPI.getData({date: l_date.sql}) // This calls the exposed method from the preload script
window.electronAPI.receiveData((data) => {
    todo_length = data.length
    let nameString = data.map((elem) => {
        return load_goals(elem.goal)
    })
})
window.electronAPI3.delete_task((event) => {
    selected_div.remove()
    let elements = document.getElementsByClassName("task")
    let before = tasks
    let index_del = elements.length

    tasks = []
    for (let i = 0; i < elements.length; i++) {
        tasks.push(elements[i].textContent)
        if (before[i] !== tasks[i]) {

            index_del = i
            break
        }
    }

    window.electronAPI5.sendId({del_id: index_del, date: l_date.sql})
})

document.getElementById("add").addEventListener('click', () => {
    new_goal()
})


function load_goals(text){
    text = text.replace("`@`", "'")
    document.getElementById("dragparent").innerHTML += "<div class='dragthing'  onmousedown='press()' onmouseup='unpress()'>" +
        "<input type='checkbox' class='check_task' ><div class='task_text'><span class='task'>" + text + "</span></div></div>"
    tasks.push(text)
}
function new_goal() {
    let goal_text = document.getElementById('entry').value

    if (goal_text !== ""){
        let text = goal_text.replace("'", "`@`")
        window.electronAPI2.sendData({goal_text: text, date: l_date.sql})
        document.getElementById("dragparent").innerHTML += "<div class='dragthing'  onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox' class='check_task' ><div class='task_text'><span class='task'>" + goal_text + "</span></div></div>"
        document.getElementById('entry').value = ""
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

