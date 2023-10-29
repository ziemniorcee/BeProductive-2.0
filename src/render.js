import {l_date} from './date.js'

let pressed = false
let selected_div = null
let press_state = 0


window.goalsAPI.askGoals({date: l_date.sql})
window.goalsAPI.getGoals((data) => data.map((elem) => {
    if (elem.check_state) build_goal(elem.goal.replace("`@`", "'"), "checked")
    else build_goal(elem.goal.replace("`@`", "'"))
}))


window.goalsAPI.removingGoal((event) => {
    if(press_state === 0){
        window.goalsAPI.goalRemoved({id: $('.dragthing').index(selected_div), date: l_date.sql})
        selected_div.remove()
    }
})
window.sidebarAPI.removingHistory((event) => {
    if(press_state===1){
        window.sidebarAPI.historyRemoved({id: $('.task_history').index(selected_div)})
        selected_div.remove()
    }
})

window.sidebarAPI.removingIdea((event) => {
    if(press_state===2){
        window.sidebarAPI.ideaRemoved({id: $('.task_history').index(selected_div)})
        selected_div.remove()
    }
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
    const goals = document.getElementById('dragparent');
    const history = document.getElementById("days")
    if (goals) {
        goals.addEventListener('contextmenu', function handleClick(event) {
            press_state = 0
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

    if(history){
        history.addEventListener('contextmenu', function handleClick(event) {
            press_state = 1
            if (event.target.classList.contains("task_history")) {
                if (event.target.parentNode.children.length === 1) selected_div = event.target.parentNode.parentNode
                else selected_div = event.target
                pressed = true
            }
        })
    }

})

document.getElementById("img_second").addEventListener('click', () => {
    setTimeout(function(){
        const history = document.getElementById("days")
        const ideas = document.getElementById("ideas")
        if(history){
            history.addEventListener('contextmenu', function handleClick(event) {
                press_state = 1
                if (event.target.classList.contains("task_history")) {
                    selected_div = event.target
                    pressed = true
                }
            })
        }

        if(ideas){
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
    if (state){
        document.getElementsByClassName("check_task")[id].outerHTML =
            "<input type='checkbox' checked class='check_task'>"
    }
    else{
        document.getElementsByClassName("check_task")[id].outerHTML =
            "<input type='checkbox' class='check_task'>"
    }
    window.goalsAPI.changeChecks({id: id, state: state, date: l_date.sql})
});

document.getElementById("entry").addEventListener('click', () => {
    document.getElementById("entry_bg").style.height="300px"
    document.getElementById("entry_bg").style.height="300px"
})

// Float bar

document.getElementById("laurels").addEventListener('click', () => {
    window.appAPI.changeWindow()
})

