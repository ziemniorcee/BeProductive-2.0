let displays = ["", ""]
let current_sidebar = 0
let sidebar_state = true

let goal_pressed = false
let saved_sidebar = ""


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


function enchance_history() {
    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            get_goal(event.target.parentNode.children[1].children[0].innerText)
            if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
            else event.target.parentNode.parentNode.parentNode.remove()

            displays[0] = document.getElementById("days").outerHTML
            window.sidebarAPI.deleteHistory({id: i})
        })
    }
}


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


function enchance_ideas() {
    let elements = document.getElementsByClassName('history_add');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', (event) => {
            get_goal(event.target.parentNode.children[0].innerText)
            event.target.parentNode.remove()
            displays[1] = document.getElementById('days').outerHTML
            window.sidebarAPI.deleteIdea({id: i})
        })
    }
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


function get_goal(text) {
    window.goalsAPI.newGoal({goal_text: text.replace("'", "`@`"), steps: []})

    let goals = document.getElementsByClassName("goal_id")

    document.getElementById("todosArea").innerHTML +=
        `<div class='todo' onmousedown='press()' onmouseup='unpress()'>
            <div class="goal_id">${goals.length}</div>
            <div class='todoCheck'><input type='checkbox' class='check_task'></div>
            <div class='task_text'><span class='task'> ${text} </span></div>
        </div>`
}


$(document).on('click', '.historyCheck', function (event) {
    setTimeout(function () {
        if (event.target.parentNode.parentNode.children.length > 1) event.target.parentNode.remove()
        else event.target.parentNode.parentNode.parentNode.remove()
        displays[0] = document.getElementById("days").outerHTML
    }, 1000)
    window.sidebarAPI.sideChangeChecks({id: $('.historyCheck').index(this)})
});


$(document).on('click', '.todo', function (event) {
    saved_sidebar = document.getElementById("rightbar").innerHTML
    displays[Number(current_sidebar)] = document.getElementById("days").innerHTML
    let selected_todo = event.target

    if (sidebar_state === false) show_hide_sidebar()
    if (event.target.children.length !== 0 && event.target.children.length !== 2) {
        let base = event.target
        if (event.target.children.length === 1) base = event.target.parentNode

        let steps_html = build_edit_steps(base)
        show_goal_edit(steps_html, base)
        enchance_edit(steps_html, selected_todo)
        goal_pressed = true
    }
});


function build_edit_steps(base) {
    let steps_html = ""
    if (base.children[2].children.length > 1) {
        let array = base.children[2].children[2].children
        for (let i = 0; i < array.length; i++) {
            steps_html += `
                <div class="editStep">
                    <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep" value="${array[i].innerText.trim()}" spellcheck="false">
                </div>`
        }
    }
    return steps_html
}


function show_goal_edit(steps_html, base) {
    let main_goal = base.children[2].children[0].innerText

    document.getElementById("rightbar").innerHTML =
        `<div id="closeEdit">⨉</div>
        <div id="todoEdit">
            <div id="editMain">
                <input type="checkbox" id="editCheck"><input type="text" id="editText"  value="${main_goal}" spellcheck="false">
            </div>
            <div id="editSteps">
                ${steps_html}
                <div id="editNewStep">
                    <span>+</span>New Step
                </div>
            </div>
        </div>`
}


function enchance_edit(steps_html, selected_todo) {
    document.getElementById("editText").addEventListener("blur", () => {
        selected_todo.children[2].children[0].innerText = document.getElementById("editText").value
    })
    let edit_steps = document.getElementsByClassName("editTextStep")

    for (let i = 0; i < edit_steps.length; i++) {
        console.log(edit_steps[i])
        edit_steps[i].addEventListener("blur", () => {
            selected_todo.children[2].children[2].children[0].children[1].innerText = document.getElementsByClassName("editTextStep")[i].value
        })
    }

    document.getElementById("closeEdit").addEventListener('click', () => show_hide_sidebar())
    add_step_edit(steps_html)
}


function add_step_edit(steps_html) {
    document.getElementById("editNewStep").addEventListener('click', () => {
        steps_html +=
            `<div class="editStep">
                <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep"  spellcheck="false">
            </div>`

        document.getElementById("editSteps").innerHTML =
            `${steps_html}
            <div id="editNewStep">
                <span>+</span>New Step
            </div>`
        add_step_edit(steps_html)
    })
}


document.getElementById("main").addEventListener('click', () => {
    if (goal_pressed === true) {
        goal_pressed = false
        document.getElementById("rightbar").innerHTML = saved_sidebar
        if (!current_sidebar) enchance_history()
        else {
            enchance_ideas()
            document.getElementById("addIdeas").addEventListener('click', () => new_idea())
            $("#entryIdeas").on('keyup', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) new_idea()
            });
        }
    } else goal_pressed = false
})


document.getElementById("img_main").addEventListener('click', () => show_hide_sidebar())


function show_hide_sidebar() {
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
        goal_pressed = false
        document.getElementById("rightbar").innerHTML = saved_sidebar
    } else displays[Number(current_sidebar)] = document.getElementById("days").innerHTML

    current_sidebar = !current_sidebar
    document.getElementById("days").innerHTML = displays[Number(current_sidebar)]
    document.getElementById("head_text").innerText = categories[Number(current_sidebar)]
    document.getElementById("days").style.overflowY = overflows[Number(current_sidebar)]

    if (!current_sidebar) enchance_history()
    else {
        enchance_ideas()
        document.getElementById("addIdeas").addEventListener('click', () => new_idea())
        $("#entryIdeas").on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) new_idea()
        });
    }

    document.getElementById("img_main").src = images[Number(current_sidebar)]
    document.getElementById("img_second").src = images[Number(!current_sidebar)]
})


function resize(e) {
    let sidebar = document.querySelector("#rightbar");
    let width = document.getElementById('container').offsetWidth
    sidebar.style.flexBasis = `${width - e.x}px`;
}


document.querySelector("#resizer").addEventListener("mousedown", (event) => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});
