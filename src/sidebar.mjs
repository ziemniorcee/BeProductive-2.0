import {build_goal} from "./render.mjs";
import {l_date} from './date.js'
import {goal_pressed, goal_pressed_false, saved_sidebar} from "./edit.mjs";
import {weekdays, month_names} from "./data.mjs";
import {dragula_day_view} from "./render.mjs";
import {build_week_goal, dragula_week_view} from "./weekView.mjs";
import {build_month_goal, dragula_month_view} from "./monthView.mjs";

let displays = ["", ""]


window.sidebarAPI.askHistory({date: l_date.day_sql})
window.sidebarAPI.getHistory((data) => {

    displays[0] = ""
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

    if ($('#head_text').text() === "History") $('#days').html(displays[0])

    if ($('#todosAll').length) dragula_day_view()
    else if ($('.weekDay').length) {
        dragula_week_view()
        $('.historyAdd').css('visibility', 'hidden')
    } else {
        dragula_month_view()
        $('.historyAdd').css('visibility', 'hidden')
    }
})

function load_history(array, date) {
    let d = new Date(date)
    let format_day = d.getDate()
    if (format_day < 10) format_day = `0${format_day}`
    let display = weekdays[d.getDay()] + ", " + month_names[d.getMonth()] + " " + format_day + ", " + d.getFullYear();
    let stringhtml = `<div class='day'><span class='historyDate'>${display}</span><div class='historyTasks'>`

    for (let i = 0; i < array.length; i++) {
        let converted_text = array[i].replace(/`@`/g, "'").replace(/`@@`/g, '"')

        stringhtml += `
        <div class='sidebarTask'>
            <input type='checkbox' class='historyCheck'>
            <div><span>${converted_text}</span></div><span class='historyAdd'>+</span>
        </div>`
    }

    stringhtml += "</div></div>"
    displays[0] += stringhtml
}

$(document).on('click', '.historyAdd', function () {
    window.sidebarAPI.deleteHistory({id: $('.historyAdd').index(this), date: l_date.day_sql})
    if ($(this).closest('.historyTasks').children().length > 1) $(this).closest('.sidebarTask').remove()
    else $(this).closest('.day').remove()
})

window.sidebarAPI.historyToGoal((steps, parameters) => {
    let month_day = $(".monthDay")
    let todos
    if ($('#todosAll').length) {
        let step_texts = []
        let step_checks = []
        for (let j = 0; j < steps.length; j++) {
            step_texts.push(steps[j].step_text)
            step_checks.push(steps[j].step_check)
        }
        let converted_text = parameters.goal.replace(/`@`/g, "'").replace(/`@@`/g, '"')
        build_goal(converted_text, step_texts, parameters.category, parameters.Importance, parameters.Difficulty, 0, step_checks)

        todos = $('#todosArea').children()
    } else if ($('.weekDay').length) {
        let week_day = $('.weekDayGoals .sidebarTask').closest('.weekDayGoals')
        week_day.append(build_week_goal(parameters, $('.todo').length))
        todos = week_day.children()
    } else {
        let month_day = $('.monthGoals .sidebarTask').closest('.monthGoals')
        month_day.append(build_month_goal(parameters, $('.monthTodo').length))
        todos = month_day.children()
    }
    let new_goal_pos = -1;

    let todo_kind = "todo"
    if (month_day.length) todo_kind = "monthTodo"

    for (let i = 0; i < todos.length; i++) if (todos[i].className !== todo_kind) new_goal_pos = i

    if (new_goal_pos !== -1) {
        $(todos[new_goal_pos]).replaceWith(todos[todos.length - 1])

        let elements = $('.todoId')
        let new_tasks = []

        if (month_day.length) elements = $('.monthTodoId')
        for (let i = 0; i < elements.length; i++) new_tasks.push(elements.eq(i).text())

        window.goalsAPI.rowsChange({after: new_tasks})
    }
})

$(document).on('click', '.historyCheck', function () {
    let that = this
    setTimeout(function () {
        if ($(that).closest('.historyTasks').children().length > 1) $(that).closest('.sidebarTask').remove()
        else $(that).closest('.day').remove()
    }, 1000)
    window.sidebarAPI.sideChangeChecks({id: $('.historyCheck').index(this)})
});


window.sidebarAPI.askIdeas()
window.sidebarAPI.getIdeas((data) => {
    let ideas_formatted = ""
    for (let i = 0; i < data.length; i++) {
        let converted_text = data[i].idea.replace(/`@`/g, "'").replace(/`@@`/g, '"')
        ideas_formatted += `
            <div class="sidebarTask">
                <span class="idea">${converted_text}</span><span class="ideasAdd">+</span>
            </div>`
    }
    displays[1] =
        `<div id='ideas'>${ideas_formatted}</div>
        <div id='ideasInput'>
            <input class='e_todo' type='text' id='ideasEntry' spellcheck='false'>
            <div class='b_add' id='ideasAdd'>+</div>
        </div>`
})

$(document).on('click', '.ideasAdd', function () {
    let id = $('.ideasAdd').index(this)
    let goal_text = $('.idea').eq(id).text()

    window.sidebarAPI.deleteIdea({id: id, goal_text: goal_text})
    build_goal(goal_text)
    $('.sidebarTask').eq(id).remove()
})

$(document).on('click', '#ideasAdd', () => new_idea())

$(document).on('keyup', '#ideasEntry', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) new_idea()
});

function new_idea() {
    let entry = $('#ideasEntry')
    let text = entry.val()

    if (text !== "") {
        let idea_formatted = `
            <div class="sidebarTask">
                <span class="idea">${text}</span><span class="ideasAdd">+</span>
            </div>`

        let ideas = $('#ideas')
        ideas.html(idea_formatted + ideas.html())
        entry.val('')

        let converted_text = text.replace(/'/g, "`@`").replace(/"/g, "`@@`")

        window.sidebarAPI.newIdea({text: converted_text})
    }
}


$(document).on('click', '#imgMain', () => show_hide_sidebar())

export function show_hide_sidebar(force = false) {
    let sidebar = $('#rightbar')
    let sidebar_state = sidebar.css('display') === 'none'
    if (force) sidebar_state = false
    sidebar.toggle(sidebar_state)
    $('#resizer').css('display', sidebar_state ? 'flex' : 'none')
}


$(document).on('click', '#imgSecond', () => {
    const days = $('#days')
    const img_main = $('#imgMain')
    let current_sidebar = img_main.attr('src') === 'images/goals/idea.png'

    if (goal_pressed) {
        goal_pressed_false()
        $('#rightbar').html(saved_sidebar)
        current_sidebar = !current_sidebar
    } else displays[Number(current_sidebar)] = days.html()

    days.html(displays[Number(!current_sidebar)])
    $('#head_text').html(current_sidebar ? "History" : "Ideas")
    days.css('overflow', current_sidebar ? "scroll" : "hidden")


    img_main.attr('src', `images/goals/${current_sidebar ? "history" : "idea"}.png`)
    $('#imgSecond').attr('src', `images/goals/${current_sidebar ? "idea" : "history"}.png`)

    if (current_sidebar) {
        if ($('#todosAll').length) dragula_day_view()
        else if ($('.weekDay').length) {
            dragula_week_view()
            $('.historyAdd').css('visibility', 'hidden')
        } else {
            dragula_month_view()
            $('.historyAdd').css('visibility', 'hidden')
        }
    }
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

