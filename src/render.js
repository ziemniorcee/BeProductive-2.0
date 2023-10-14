import {l_date} from './date.js'

let pressed = false
let selected_div = null


window.goalsAPI.askGoals({date: l_date.sql})
window.goalsAPI.getGoals((data) => data.map((elem) => {
    if (elem.check_state) build_goal(elem.goal.replace("`@`", "'"), "checked")
    else  build_goal(elem.goal.replace("`@`", "'"))
}))


window.goalsAPI.removingGoal((event) => {
    window.goalsAPI.goalRemoved({id: $('.dragthing').index(selected_div), date: l_date.sql})
    selected_div.remove()
})

document.getElementById("add").addEventListener('click', () => new_goal())

$("#entry").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});

function new_goal() {
    let goal_text = document.getElementById('entry').value
    if (goal_text !== "") {
        window.goalsAPI.newGoal({goal_text: goal_text.replace("'", "`@`")})
        build_goal(goal_text)
        document.getElementById('entry').value = ""
    }
}

function build_goal(goal_text, checked = "") {
    document.getElementById("dragparent").innerHTML +=
        "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
        "   <input type='checkbox' " + checked + " class='check_task' >" +
        "   <div class='task_text'><span class='task'>" + goal_text + "</span></div>" +
        "</div>"
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


$(document).on('click', '.check_task', function () {
    let id = $('.check_task').index(this)
    let state = Number(document.getElementsByClassName("check_task")[id].checked)
    window.goalsAPI.changeChecks({id: id, state: state, date: l_date.sql})
});

