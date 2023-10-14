let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let images = ["images/goals/history.png", "images/goals/idea.png"]
let displays = ["", ""]
let current_sidebar = 0
let categories = ["History", "Ideas"]

const resizer = document.querySelector("#resizer");
const sidebar = document.querySelector("#rightbar");
let sidebar_state = true
sidebar.style.flexBasis = '500px';

const mainContent = document.querySelector("#main-content");
document.getElementById("img_main").addEventListener('click', () => {
    sidebar_state = !sidebar_state
    if (sidebar_state) {
        sidebar.style.display = 'block'
        resizer.style.display = 'flex'
    } else {
        sidebar.style.display = 'none'
        resizer.style.display = 'none'
    }
})


document.getElementById("img_second").addEventListener('click', () => {
    let overflows = ["scroll", "hidden"]
    current_sidebar = !current_sidebar
    document.getElementById("days").innerHTML = displays[Number(current_sidebar)]
    document.getElementById("head_text").innerText = categories[Number(current_sidebar)]
    document.getElementById("days").style.overflowY = overflows[Number(current_sidebar)]

    if (!current_sidebar) enchance_history()
    else enchance_ideas()

    document.getElementById("img_main").src = images[Number(current_sidebar)]
    document.getElementById("img_second").src = images[Number(!current_sidebar)]
})

load_ideas()

window.sidebarAPI.askHistory()
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
    let d = new Date(date)
    let format_day = d.getDate()
    if (format_day < 10) format_day = "0" + format_day

    let display = weekdays[d.getDay()] + ", " + month_names[d.getMonth()] + " " + format_day + ", " + d.getFullYear();

    let stringhtml = "<div class='day'><span class='history_date'>" + display + "</span><div class='tasks_history'>"


    for (let i = 0; i < array.length; i++) {
        stringhtml += "<div class='task_history'><input type='checkbox' " +
            "class='check_history'><div><span>" + array[i].replace("`@`", "'") + "</span></div><span class='history_add'>+</span></div>"
    }
    stringhtml += "</div></div>"
    displays[0] += stringhtml
    document.getElementById("days").innerHTML = displays[0]
}

function enchance_history() {

    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
            else event.target.parentNode.parentNode.parentNode.remove()

            displays[0] = document.getElementById("days").outerHTML
            window.sidebarAPI.importHistory({id: i})
            get_goal(event.target.parentNode.childNodes[1].childNodes[0].innerText)

        })

    }
}

function get_goal(text) {
    window.goalsAPI.newGoal({goal_text: text.replace("'", "`@`")})
    document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
        "<input type='checkbox'  class='check_task' ><div class='task_text'><span class='task'>" + text + "</span></div></div>"
}

function load_ideas() {
    let data = ["xdd1", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2", "xdd2"]
    let ideas_formatted = ""

    for (let i = 0; i < data.length; i++) {
        ideas_formatted += '<div class="task_history"><span class="idea">' + data[i] + '</span><span class="history_add">+</span></div>'
    }

    displays[1] =
        "<div id='ideas'>" + ideas_formatted + "</div>" +
        "<div id='input_2'>" +
        "   <button class='add_but' id='add2'><span>+</span></button>" +
        "   <input class='add_entry' type='text' id='entry2' spellcheck='false'>" +
        "</div>"
}


function enchance_ideas() {
    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            console.log(i)
        })
    }
}


$(document).on('click', '.check_history', function (event) {
    setTimeout(function () {
        if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
        else event.target.parentNode.parentNode.parentNode.remove()

        displays[0] = document.getElementById("days").outerHTML
    }, 1000)

    window.sidebarAPI.changeChecks({id: $('.check_history').index(this)})
});

function resize(e) {
    let width = document.getElementById('container').offsetWidth
    sidebar.style.flexBasis = `${width - e.x}px`;
}

resizer.addEventListener("mousedown", (event) => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});