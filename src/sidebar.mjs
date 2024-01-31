import {build_goal} from "./render.mjs";
import {l_date} from './date.js'
import {goal_pressed, goal_pressed_false, saved_sidebar} from "./edit.mjs";

let displays = ["", ""]
export let current_sidebar = 0
export let sidebar_state = true


window.sidebarAPI.askHistory({date: l_date.sql})
window.sidebarAPI.getHistory((data) => {
    let date = data[0].addDate
    let goals = []

    for (let i = 0; i < data.length; i++) {
        if (date !== data[i].addDate) {
            load_history(goals, date)
            goals = []
            date = data[i].addDate
        }
        goals.push(data[i].goal)
    }
    load_history(goals, date)
    enchance_history()
})


function load_history(array, date) {
    let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let d = new Date(date)
    let format_day = d.getDate()
    if (format_day < 10) format_day = `0${format_day}`
    let display = weekdays[d.getDay()] + ", " + month_names[d.getMonth()] + " " + format_day + ", " + d.getFullYear();
    let stringhtml = `<div class='day'><span class='historyDate'>${display}</span><div class='tasks_history'>`

    for (let i = 0; i < array.length; i++) {
        stringhtml += `
        <div class='sidebarTask'>
            <input type='checkbox' class='historyCheck'>
            <div><span>${array[i].replace("`@`", "'")}</span></div><span class='history_add'>+</span>
        </div>`
    }

    stringhtml += "</div></div>"
    displays[0] += stringhtml
    document.getElementById("days").innerHTML = displays[0]
}

let goal_text = ""
export function enchance_history() {
    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            goal_text = event.target.parentNode.children[1].children[0].innerText
            if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
            else event.target.parentNode.parentNode.parentNode.remove()

            displays[0] = document.getElementById("days").outerHTML
            window.sidebarAPI.deleteHistory({id: i})
        })
    }
}

window.sidebarAPI.historyToGoal((steps, parameters) => {
    let step_texts = []
    let step_checks = []
    for (let j = 0; j < steps.length; j++) {
        step_texts.push(steps[j].step_text)
        step_checks.push(steps[j].step_check)
    }
    build_goal(goal_text, step_texts ,parameters[0], parameters[1], parameters[2], 0, step_checks)
})

window.sidebarAPI.askIdeas()
window.sidebarAPI.getIdeas((data) => {
    let ideas_formatted = ""
    for (let i = 0; i < data.length; i++) {
        ideas_formatted +=
            '<div class="sidebarTask">' +
            '   <span class="idea">' + data[i].idea + '</span><span class="history_add">+</span>' +
            '</div>'
    }
    displays[1] =
        `<div id='ideas'>${ideas_formatted}</div>
        <div id='inputIdeas'>
            <button class='b_add' id='addIdeas'><span>+</span></button>
            <input class='e_todo' type='text' id='entryIdeas' spellcheck='false'>
        </div>`
})


export function enchance_ideas() {
    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            let goal_text = event.target.parentNode.children[0].innerText
            build_goal(goal_text)

            event.target.parentNode.remove()
            displays[1] = document.getElementById('days').outerHTML
            window.sidebarAPI.deleteIdea({id: i, goal_text: goal_text})
        })
    }
    document.getElementById("addIdeas").addEventListener('click', () => new_idea())
    $("#entryIdeas").on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) new_idea()
    });
}


function new_idea() {
    let text = document.getElementById('entryIdeas').value
    if (text !== "") {
        window.sidebarAPI.newIdea({text: text.replace("'", "`@`")})
        let idea_formatted =
            '<div class="sidebarTask">' +
            '   <span class="idea">' + text + '</span><span class="history_add">+</span>' +
            '</div>'
        document.getElementById("ideas").innerHTML = idea_formatted + document.getElementById("ideas").innerHTML
        displays[1] = document.getElementById("days").outerHTML
        document.getElementById('entryIdeas').value = ""
        enchance_ideas()
    }
}


$(document).on('click', '.historyCheck', function (event) {
    setTimeout(function () {
        if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
        else event.target.parentNode.parentNode.parentNode.remove()
        displays[0] = document.getElementById("days").outerHTML
    }, 1000)
    window.sidebarAPI.sideChangeChecks({id: $('.historyCheck').index(this)})
});

document.getElementById("img_main").addEventListener('click', () => show_hide_sidebar())


export function show_hide_sidebar() {
    let sidebar = document.querySelector("#rightbar");
    let resizer = document.querySelector("#resizer");
    sidebar_state = !sidebar_state
    if (sidebar_state) {
        sidebar.style.display = 'block'
        resizer.style.display = 'flex'
    } else {
        sidebar.style.display = 'none'
        resizer.style.display = 'none'
    }
}

document.getElementById("img_second").addEventListener('click', () => {
    let overflows = ["scroll", "hidden"]
    let categories = ["History", "Ideas"]
    let images = ["images/goals/history.png", "images/goals/idea.png"]


    if (goal_pressed) {
        goal_pressed_false()
        document.getElementById("rightbar").innerHTML = saved_sidebar
    } else displays[Number(current_sidebar)] = document.getElementById("days").innerHTML

    current_sidebar = !current_sidebar
    document.getElementById("days").innerHTML = displays[Number(current_sidebar)]
    document.getElementById("head_text").innerText = categories[Number(current_sidebar)]
    document.getElementById("days").style.overflowY = overflows[Number(current_sidebar)]

    if (!current_sidebar) enchance_history()
    else {
        enchance_ideas()

    }

    document.getElementById("img_main").src = images[Number(current_sidebar)]
    document.getElementById("img_second").src = images[Number(!current_sidebar)]
})


function resize(e) {
    let sidebar = document.querySelector("#rightbar");
    let width = document.getElementById('container').offsetWidth
    sidebar.style.flexBasis = `${width - e.x}px`;
}


document.querySelector("#resizer").addEventListener("mousedown", () => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});
