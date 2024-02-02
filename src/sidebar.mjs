import {build_goal} from "./render.mjs";
import {l_date} from './date.js'
import {goal_pressed, goal_pressed_false, saved_sidebar} from "./edit.mjs";
import {weekdays, month_names} from "./data.mjs";

let displays = ["", ""]


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
})

function load_history(array, date) {
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

$(document).on('click', '.history_add', function () {
    window.sidebarAPI.deleteHistory({id: $('.history_add').index(this)})

    if ($(this).closest('.tasks_history').children().length > 1) $(this).closest('.sidebarTask').remove()
    else $(this).closest('.day').remove()
})

window.sidebarAPI.historyToGoal((steps, parameters) => {
    let step_texts = []
    let step_checks = []
    for (let j = 0; j < steps.length; j++) {
        step_texts.push(steps[j].step_text)
        step_checks.push(steps[j].step_check)
    }
    build_goal(parameters[0], step_texts, parameters[1], parameters[2], parameters[3], 0, step_checks)
})

$(document).on('click', '.historyCheck', function () {
    let that = this
    setTimeout(function () {
        if ($(that).closest('.tasks_history').children().length > 1) $(that).closest('.sidebarTask').remove()
        else $(that).closest('.day').remove()
    }, 1000)
    window.sidebarAPI.sideChangeChecks({id: $('.historyCheck').index(this)})
});


window.sidebarAPI.askIdeas()
window.sidebarAPI.getIdeas((data) => {
    let ideas_formatted = ""
    for (let i = 0; i < data.length; i++) {
        ideas_formatted += `
            <div class="sidebarTask">
                <span class="idea">${data[i].idea}</span><span class="ideasAdd">+</span>
            </div>`
    }
    displays[1] =
        `<div id='ideas'>${ideas_formatted}</div>
        <div id='inputIdeas'>
            <button class='b_add' id='addIdeas'><span>+</span></button>
            <input class='e_todo' type='text' id='entryIdeas' spellcheck='false'>
        </div>`
})

$(document).on('click', '.ideasAdd', function () {
    let id = $('.ideasAdd').index(this)
    let goal_text = $('.idea').eq(id).text()

    window.sidebarAPI.deleteIdea({id: id, goal_text: goal_text})
    build_goal(goal_text)
    $('.sidebarTask').eq(id).remove()
})

$(document).on('click', '#addIdeas', () => new_idea())

$(document).on('keyup', '#entryIdeas',  (e)=> {
    if (e.key === 'Enter' || e.keyCode === 13) new_idea()
});

function new_idea() {
    let entry = $('#entryIdeas')
    let text = entry.val()

    if (text !== "") {
        let idea_formatted = `
            <div class="sidebarTask">
                <span class="idea">${text}</span><span class="ideasAdd">+</span>
            </div>`

        let ideas =  $('#ideas')
        ideas.html(idea_formatted +  ideas.html())
        entry.val('')

        window.sidebarAPI.newIdea({text: text.replace("'", "`@`")})
    }
}


$(document).on('click', '#img_main', () => show_hide_sidebar())

export function show_hide_sidebar() {
    let sidebar = $('#rightbar')
    let sidebar_state = sidebar.css('display') === 'none'
    sidebar.toggle(sidebar_state)
    $('#resizer').css('display', sidebar_state ? 'flex' : 'none')
}


$(document).on('click', '#img_second', () =>{
    const days = $('#days')
    const img_main =  $('#img_main')
    let current_sidebar = img_main.attr('src') === 'images/goals/idea.png'

    if (goal_pressed) {
        goal_pressed_false()
        $('#rightbar').html(saved_sidebar)
    } else displays[Number(current_sidebar)] = days.html()

    days.html(displays[Number(!current_sidebar)])
    $('#head_text').html(current_sidebar ? "History" : "Ideas")
    days.css('overflow',current_sidebar ? "scroll" : "hidden")

    img_main.attr('src', `images/goals/${current_sidebar ? "history" : "idea"}.png`)
    $('#img_second').attr('src', `images/goals/${current_sidebar ? "idea" : "history"}.png`)
})


document.querySelector("#resizer").addEventListener("mousedown", () => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});

function resize(e) {
    let sidebar = document.querySelector("#rightbar");
    let width = document.getElementById('container').offsetWidth
    sidebar.style.flexBasis = `${width - e.x}px`;
}