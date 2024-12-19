import {decode_text, encode_text} from "./data.mjs";

export class HistorySidebar {
    constructor(app_data, app_date, app_steps) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date
        this.steps = app_steps
    }

    initEventListeners() {
        $(document).on('click', '.historyAdd', (event) => {
            event.stopPropagation()
            this.get_history_goal(event.currentTarget)
        })


        $(document).on('click', '.historyCheck', (event) => {
            this.change_history_check(event.currentTarget)
        });


    }

    /**
     * Displays history sidebar on #rightbar
     */
    async show_history_sidebar() {
        _show_sidebar()
        $('#rightbar').html(`
            <div id="head">
                <div id="gloryButton">
                    <img id="gloryImg" src="images/goals/trophy.png" alt="main">
                </div>
                <div id="sidebarClose">⨉</div>
                <img src="images/goals/polaura.png" alt="polaura" width="25" height="50">
                <span id="head_text">History</span>
                <img src="images/goals/polaura.png" class="polaura2" alt="polaura" width="25" height="50">
            </div>
            <div id="days">
    
            </div>`)

        let date = ""
        if ($('#todosAll').length) date = l_date.day_sql
        else if ($('.weekDay').length) date = l_date.week_now[0]
        else if ($('#monthGrid').length) date = l_date.get_sql_month(l_date.day_sql)[0]
        let goals = await window.sidebarAPI.askHistory({date: date})

        this.build_history_sidebar(goals)
    }

    /**
     * builds history sidebar
     * @param data data from sql
     */
    build_history_sidebar(data) {
        let grouped_goals = data.reduce((acc, curr) => {
            if (!acc[curr.addDate]) {
                acc[curr.addDate] = [];
            }
            acc[curr.addDate].push(curr.goal);
            return acc;
        }, {});

        let days_HTML = ""
        for (let date in grouped_goals) {
            days_HTML += this.build_history_day(grouped_goals[date], date)
        }

        $('#days').html(days_HTML)
        if (!$('#todosAll').length) $('.historyAdd').css('visibility', 'hidden')
    }

    /**
     * Builds history day
     * @param goals goals from given day
     * @param date date of day
     * @returns {string} HTML of history day
     */
    build_history_day(goals, date) {
        let display = l_date.get_display_format(date)

        let goals_HTML = ''
        for (let i = 0; i < goals.length; i++) {
            goals_HTML += this.build_history_goal(goals[i])
        }

        return `
        <div class="day">
            <span class="historyDate">${display}</span>
            <div class="historyTasks">${goals_HTML}</div>
        </div>`
    }

    /**
     * Builds history goal
     * @param goal goal text
     * @returns {string} HTML of goal
     */
    build_history_goal(goal) {
        let converted_text = decode_text(goal)

        return `
        <div class='sidebarTask'>
            <input type='checkbox' class='historyCheck'>
            <div><span class="historyText">${converted_text}</span></div><span class='historyAdd'>+</span>
        </div>`
    }

    /**
     * Adding goal to main from history by clicking plus on goal
     */
    get_history_goal(that) {
        window.sidebarAPI.deleteHistory({id: $('.historyAdd').index(that), date: l_date.day_sql})
        if ($(that).closest('.historyTasks').children().length > 1) $(that).closest('.sidebarTask').remove()
        else $(that).closest('.day').remove()
    }

    /**
     * Generates steps array ready to generate goal
     * @param steps given data of steps
     * @returns {*[]} array of steps
     */
    _prepare_steps(steps) {
        let steps_array = []
        for (let j = 0; j < steps.length; j++) {
            steps_array.push({
                step_text: decode_text(steps[j].step_text),
                step_check: steps[j].step_check,
            })
        }
        return steps_array
    }

    /**
     * Fixes order of goals
     * @param todos given goals
     */
    _fix_order(todos) {
        let new_goal_pos = -1;
        for (let i = 0; i < todos.length; i++) if (todos[i].className === "sidebarTask") new_goal_pos = i

        if (new_goal_pos !== -1) {
            $(todos[new_goal_pos]).replaceWith(todos[todos.length - 1])

            let new_tasks = []

            let elements = $('.todoId')
            if ($(".monthDay").length) elements = $('.monthTodoId')
            for (let i = 0; i < elements.length; i++) new_tasks.push(elements.eq(i).text())

            window.goalsAPI.rowsChange({after: new_tasks})
        }
    }

    /**
     * Ticks history check and after one second removes it from sidebar
     * @param that clicked element
     */
    change_history_check(that) {
        setTimeout(function () {
            let check_state = $(that).prop('checked')
            if (check_state) {
                window.sidebarAPI.sideChangeChecks({id: $('.historyCheck').index(that), state: 1})

                if ($(that).closest('.historyTasks').children().length > 1) $(that).closest('.sidebarTask').remove()
                else $(that).closest('.day').remove()
            }
        }, 1000)
    }
}


export class Idea {
    constructor(app_data, app_date) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date
    }

    initEventListeners() {
        $(document).on('click', '#sideIdeas', () => this.show_ideas_sidebar())

        window.sidebarAPI.getIdeas((data) => {
            this.build_ideas_sidebar(data)
        })


        $(document).on('click', '.ideasAdd', (event) => {
            this.add_idea(event.currentTarget)
        })

        $(document).on('click', '#ideasAdd', () => this.new_idea())

        $(document).on('keyup', '#ideasEntry', (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) this.new_idea()
        });

    }

    /**
     * builds core of ideas sidebar
     */
    show_ideas_sidebar() {
        _show_sidebar()
        $('#rightbar').html(`
        <div id="head">
            <div id="gloryButton">
                <img id="gloryImg" src="images/goals/trophy.png" alt="main">
            </div>
            <div id="sidebarClose">⨉</div>
            <img src="images/goals/polaura.png" alt="polaura" width="25" height="50">
            <span id="head_text">Ideas</span>
            <img src="images/goals/polaura.png" class="polaura2" alt="polaura" width="25" height="50">
        </div>
        <div id="days">
            <div id='ideas'></div>
            <div id='ideasInput'>
                <input class='e_todo' type='text' id='ideasEntry' spellcheck='false'>
                <div class='b_add' id='ideasAdd'>+</div>
            </div>
        </div>
    `)
        window.sidebarAPI.askIdeas()
    }

    /**
     * Builds ideas in sidebar
     * @param data data of ideas
     */
    build_ideas_sidebar(data) {
        let ideas_formatted = ""
        for (let i = 0; i < data.length; i++) {
            let converted_text = data[i].idea.replace(/`@`/g, "'").replace(/`@@`/g, '"')
            ideas_formatted += `
            <div class="sidebarTask">
                <span class="idea">${converted_text}</span><span class="ideasAdd">+</span>
            </div>`
        }
        $('#ideas').html(ideas_formatted)
    }

    /**
     * Adds idea to the main
     * @param that clicked ideas
     */
    add_idea(that) {
        let id = $('.ideasAdd').index(that)
        let goal_text = $('.idea').eq(id).text()

        window.sidebarAPI.deleteIdea({
            id: id,
            goal_text: encode_text(goal_text),
            date: l_date.day_sql
        })

        let import_goal = {
            goal: goal_text,
            main_check: 0,
            steps: "",
            category: 1,
            importance: 2,
            difficulty: 2,
            knot_id: null,
        }

        $("#todosArea").append(build_goal(import_goal))
        $('.sidebarTask').eq(id).remove()
    }

    /**
     * Adds new idea to ideas sidebar
     */
    new_idea() {
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

}


export function _show_sidebar() {
    let right_bar = $('#rightbar')
    let resizer = $('#resizer')
    if (right_bar.css('display') === 'none') {
        right_bar.toggle()
        resizer.css('display', 'flex')
    }
}

export function _hide_sidebar() {
    let right_bar = $('#rightbar')
    let resizer = $('#resizer')
    if (right_bar.css('display') === 'block') {
        right_bar.toggle()
        right_bar.html("")
        resizer.css('display', 'none')
    }
}

//force = false
export function show_hide_sidebar(force = false) {
    let sidebar = $('#rightbar')
    let sidebar_state = sidebar.css('display') === 'none'
    if (force) sidebar_state = false
    sidebar.toggle(sidebar_state)
    $('#resizer').css('display', sidebar_state ? 'flex' : 'none')
}

$(document).on('click', '#sidebarClose', show_hide_sidebar)

document.querySelector("#resizer").addEventListener("mousedown", () => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});

/**
 * Resizes sidebar
 * @param event given state of resizer
 */
function resize(event) {
    let sidebar = document.querySelector("#rightbar");
    let width = document.getElementById('container').offsetWidth
    sidebar.style.flexBasis = `${width - event.x}px`;
}



