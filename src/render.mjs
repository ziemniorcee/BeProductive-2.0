import {l_date} from './date.js'
import {categories, check_border, decode_text, encode_text, getIdByColor, weekdays2} from "./data.mjs";
import {change_category, close_edit, set_goal_pos} from "./edit.mjs";
import {
    already_emblem_HTML,
    build_project_goal, project_emblem_html,
    project_pos
} from "./project.mjs";


export let todo_dragged = false
let repeat_option = null
let input_count = 0
let block_prev_drag = 0


window.addEventListener('DOMContentLoaded', function () {
    day_view()
});

$(document).on('click', '#dashMyDayBtn', () => {
    l_date.set_attributes(l_date.today)
    day_view()
})

$(document).on('click', '#dashTomorrowBtn', () => {
    l_date.set_attributes(l_date.tomorrow)
    day_view()
})

$(document).on('click', '#dashDay', function () {
    day_view()
})

/**
 * Displays day view in #main
 * 1st part fixes css
 * 2nd part builds view, gets goals, allows drag&drop and closes edit
 */
export function day_view() {
    repeat_option = null

    $('#content').css('flexDirection', 'column')
    $('.dashViewOption').css('backgroundColor', '#55423B')
    $('#dashDay').css('backgroundColor', '#FF5D00')

    window.goalsAPI.askGoals({date: l_date.day_sql})

    build_view(_day_view_main(), _day_view_header())
    dragula_day_view()
    close_edit()
}

window.goalsAPI.getGoals((goals) => get_goals(goals))

/**
 * Gets goals from ipcHandlers
 * 1st it iterates thorough goals and appends them to proper to do section
 * 2nd it
 * @param goals data of goals
 */
function get_goals(goals){
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_html(goals[i].steps, goals[i].category)
        goals[i]['goal'] = decode_text(goals[i]['goal'])

        let todo_area = goals[i]['check_state'] ? "#todosFinished" : "#todosArea";
        $(todo_area).append(build_goal(goals[i]))
    }

    build_goal_count()
}

/**
 * Counts goals finished goals
 * if there are finished goals it adds button for finished goals
 */
function build_goal_count(){
    let finished_count = $('#todosFinished .todo').length
    $('#finishedButton').css('display', finished_count ? "block" : "none")
    $("#finishedCount").html(finished_count);
}

/**
 * builds goal from given data and returns HTML
 * @param goal dict of goal's data
 * @returns {string} HTML of built goal
 */
export function build_goal(goal) {
    let todo_id = $('#todosAll .todo').length
    let category_color = categories[goal.category][0]
    let check_state = goal.check_state ? "checked" : "";
    let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
    let url = `images/goals/rank${goal.difficulty}.svg`
    let repeat = _repeat_html(goal.knot_id)
    let project_emblem = project_emblem_html(goal.pr_pos)

    return `
        <div class='todo'>
            <div class="todoId">${todo_id}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px solid ${check_border[goal.importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='taskText'>
                <span class='task'> ${goal.goal} </span>
                ${repeat}
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
}

$(document).on('click', '#todoAdd', (event) => {
    event.stopPropagation()
    new_goal()
})

$(document).on('keyup', '#todoEntrySimple', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});

/**
 * Creates new goal by
 * getting goal name, creating new goal dict, adds to proper destination
 * saves to the sql
 */
function new_goal() {
    let e_todo = $('#todoEntryGet')
    let goal_text = e_todo.val()
    e_todo.val('')

    if (goal_text.trim() !== "") {
        let steps = _new_goal_steps()
        let goal = _new_goal_dict(goal_text, steps)

        if (!$('#projectHeader').length) {
            $('#todosArea').append(build_goal(goal))
            goal['project_pos'] = -1
        }
        else{
            $('#projectTodo .projectSectionGoals').append(build_project_goal(goal))
            goal['project_pos'] = project_pos
        }
        goal['goal'] = encode_text(goal_text)
        goal['steps'] = steps
        goal['dates'] = l_date.get_repeat_dates(repeat_option)

        window.goalsAPI.newGoal(goal)
    }
}

// removing functions
(function () {
    let selected_div = null

    $(document).on('contextmenu', '#main .todo, .monthTodo', function (event) {
        if ($(this).find('.repeatLabelShow').length) window.appAPI.contextMenuOpen({repeat: 1})
        else window.appAPI.contextMenuOpen({repeat: 0, option: 0})

        selected_div = event.target
    })

    $(document).on('contextmenu', '#sideProjectGoals .todo', function (event) {
        window.appAPI.contextMenuOpen({repeat: 0, option: 3})

        selected_div = event.target
    })

    $(document).on('contextmenu', '.sidebarTask', function (event) {
        selected_div = event.target
        if ($(this).parents('.historyTasks').length) window.appAPI.contextMenuOpen({repeat: 0, option: 1})
        else window.appAPI.contextMenuOpen({repeat: 0, option: 2})
    })

    window.goalsAPI.removingGoal(() => {
        let id = $(selected_div).find('.todoId').text()
        if ($('#monthGrid').length) id = $(selected_div).find('.monthTodoId').text()

        window.goalsAPI.goalRemoved({id: id, date: l_date.day_sql})
        if ($('#todosAll').length) {
            if ($(selected_div).find('.check_task').prop('checked')) {
                let finished_count = $('#todosFinished .todo').length
                if (finished_count === 1) $('#finishedButton').css('display', 'none')
                $('#finishedCount').html(finished_count - 1)
            }
        }
        selected_div.remove()

        let goals = $('.todoId')
        for (let i = 0; i < goals.length; i++) {
            if (goals.eq(i).html() > id) goals.eq(i).html(goals.eq(i).html() - 1)
        }
        close_edit()
    })

    window.goalsAPI.removingFollowing(() => {
        let id = $(selected_div).find('.todoId').text()
        let date = l_date.day_sql
        if ($('#monthGrid').length) {
            id = $(selected_div).find('.monthTodoId').text()
            let day = Number($(selected_div).closest('.monthDay').find('.monthDate').text()) //returns wrong day
            date = l_date.get_sql_month_day(day)
        } else if ($('.weekDay').length) {
            let day = $(selected_div).closest('.weekDay').find('.weekDayText').text()
            let index = weekdays2.indexOf(day)
            date = l_date.week_current[index]
        }

        window.goalsAPI.followingRemoved({id: id, date: date})

        if ($('#todosAll').length) {
            let goals = $('.todoId')
            for (let i = 0; i < goals.length; i++) {
                if (goals.eq(i).html() > id) goals.eq(i).html(goals.eq(i).html() - 1)
            }
            selected_div.remove()
        }
        close_edit()
    })

    window.goalsAPI.getFollowingRemoved((positions) => {
        let elements_ids = $('#monthGrid').length ? $('.monthTodoId') : $('.todoId')
        let todo_type = $('#monthGrid').length ? '.monthTodo' : '.todo'

        let saved = []
        for (let i = 0; i < elements_ids.length; i++) {
            if (positions.includes(Number(elements_ids.eq(i).text()))) {
                elements_ids.eq(i).closest(todo_type).remove()
            } else saved.push(Number(elements_ids.eq(i).text()))
        }
        saved = saved.sort()

        elements_ids = $('#monthGrid').length ? $('.monthTodoId') : $('.todoId')
        for (let i = 0; i < elements_ids.length; i++) {
            elements_ids.eq(i).text((saved.indexOf(Number(elements_ids.eq(i).text()))))
        }
    })

    window.sidebarAPI.removingHistory(() => {
        window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
        if ($(selected_div).closest('.historyTasks').children().length === 1) {
            selected_div = $(selected_div).closest('.day')
        }
        selected_div.remove()
    })

    window.sidebarAPI.removingIdea(() => {
        window.sidebarAPI.ideaRemoved({id: $('.sidebarTask').index(selected_div)})
        selected_div.remove()
    })

    window.sidebarAPI.removingProjectGoal(() => {
        window.sidebarAPI.projectGoalRemoved({id: $('#sideProjectGoals .todo').index(selected_div)})
        selected_div.remove()
    })
})();


$(document).on('click', ".repeatOption", function (event) {
    event.stopPropagation()
    let new_repeat = $('.repeatOption').index(this)
    $("#repeatPicker").toggle()

    if (repeat_option === new_repeat) {
        repeat_option = null
        $(".repeatOption").css("background-color", "#282828")
        $('#repeatImg').attr('src', `./images/goals/repeat.png`)
    } else {
        repeat_option = new_repeat
        $(".repeatOption").css("background-color", "#282828")
        $(this).css("background-color", "#3E3C4B")
        $('#repeatImg').attr('src', `./images/goals/repeat${new_repeat}.png`)
    }
})


$(document).on('click', '.category', function () {
    let index = $(this).closest('.categoryPicker').find('.category').index(this) + 1
    let select_category = $('#selectCategory')

    if ($(this).closest('.categoryPicker').attr('id') === "categoryPicker2") {
        select_category = $('#selectCategory2')
        change_category(index)
    }
    else if ($(this).closest('.categoryPicker').attr('id') === "categoryPicker3"){
        select_category = $('#selectCategory3')
        $('#categoryPicker3').css('display', 'none')
    }

    select_category.css('background', categories[index][0])
    select_category.text(categories[index][1])
});


$(document).on('click', '.stepsShow', (event) => show_steps(event));

function show_steps(event1) {
    const steps = $(event1.target).closest(".taskText").find('.steps')
    let show = steps.css("display") === "block"
    steps.css("display", show ? 'none' : 'block')
    $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
    dragula_day_view()
}


$(document).on('change', '.stepEntry', function () {
    if ($('.stepEntry').index(this) === input_count) {
        input_count += 1
        $('#newSteps').append(`<div class="newStepText"><input type='text' class='stepEntry' placeholder="Action ${input_count + 1}"></div>`)
    }
});

$(document).on('keydown', '.stepEntry', function (event) {
    if (event.which === 9) {
        let step_entry = $('.stepEntry')
        if (step_entry.index(this) === input_count && $(this).val() !== "") {
            event.preventDefault();
            input_count += 1
            $('#newSteps').append(`<div class="newStepText"><input type='text' class='stepEntry' placeholder="Action ${input_count + 1}"></div>`)
            step_entry = $('.stepEntry')
            step_entry.eq(input_count).focus()
        } else if ($(this).val() === "") event.preventDefault();
    }
});


$(document).on('click', '#todosAll .check_task', function () {
    let id = $('.check_task').index(this)
    change_check(id)
});


export function change_check(id, sidebar_option=0,sidebar_state=0) {
    const check_task = $('.check_task').eq(id)
    const dot = $('.checkDot').eq(id)

    let todo = $('.todo')
    let goal_id = $('.todoId')
    if ($('#monthGrid').length) {
        goal_id = $('.monthTodoId')
        todo = $('.monthTodo')
    }

    if (sidebar_option){
        window.sidebarAPI.sideChangeChecks({id: id, state:sidebar_state, option:sidebar_option})
    }
    else{
        let state = Number(check_task.prop('checked'))
        let array_id = Number(goal_id.eq(id).html())

        check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task'>`)

        let category_color = $(dot).css('borderColor')
        $(dot).replaceWith(`<div class="checkDot" style="background-image: ${state ? "url('images/goals/check.png')" : ""}; border-color:${category_color}">`)

        todo.eq(id).remove()

        $(state ? "#todosFinished" : "#todosArea").append(todo.eq(id).prop("outerHTML"))

        dragula_day_view()
        let new_tasks = goal_id.map(function () {
            return $(this).text();
        }).get()

        window.goalsAPI.changeChecksGoal({id: array_id, state: state})
        if ($('#todosAll').length) window.goalsAPI.rowsChange({after: new_tasks})

        build_goal_count()

        if (l_date.day_sql !== l_date.today_sql) window.sidebarAPI.askHistory({date: l_date.today_sql})
    }
}


$(document).on('click', '.stepCheck', function () {
    const step_check = $('.stepCheck')
    let step_id_rel = $(this).closest('.step').index()
    let goal_id = $(this).closest('.todo').find('.todoId').text()

    let step_id_unrel = step_check.index(this)
    let counter_html = $(this).closest(".todo").find('.counter').get(0)
    if (this.checked) {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) + 1
    } else {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({id: goal_id, step_id: step_id_rel, state: Number(this.checked)})
});


$(document).on('click', '.sidebarTask', function () {
    block_prev_drag = 0
})

export function dragula_day_view() {
    block_prev_drag = 0
    let dragged_task
    let dragula_array
    let todos_area_before

    let rightbar = $('#rightbar')
    let is_edit = $('#editTodo').length
    let is_project_sidebar = $('#sideProjectHeader').length

    if (!is_edit){
        rightbar.html(rightbar.html())
        if (is_project_sidebar) {
            dragula_array = Array.from($('#sideProjectGoals')).concat([document.querySelector("#todosArea")])
        } else {
            dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])
        }
    }

    dragula(dragula_array, {
        copy: function (el) {
            return el.parentNode.id !== "todosArea";
        },
        accepts: function (el, target) {
            block_prev_drag = 0
            return target.parentNode.id === "todosAll";
        },
        moves: function (el) {
            let is_in = $(el).find('.alreadyEmblem').length
            let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'

            if (block_prev_drag === 0 && is_in === 0 && !is_done) {
                block_prev_drag = 1
                return true
            } else return false
        },
    }).on('drag', function (event) {
        todo_dragged = true
        dragged_task = $(event)
        block_prev_drag = 0

        todos_area_before = Array.from($('#todosArea').children())
    }).on('drop', function (event) {
        let new_goal_pos = $('.todo').index($(event))
        set_goal_pos(new_goal_pos)
        let todos_area_after = Array.from($('#todosArea').children())

        if(todos_area_after.length !== todos_area_before.length) {
            if (dragged_task.attr('class') === "sidebarTask") get_from_history(dragged_task)
            else if (dragged_task.parent().attr('id') === "sideProjectGoals") {
                console.log(dragged_task.parent().attr("id"))
                get_from_project(new_goal_pos, dragged_task)
            }
        }
        else{
            _change_order()
        }
    });
}

function get_from_history(dragged_task) {
    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(dragged_task), date: l_date.day_sql})

    if (dragged_task.closest('.historyTasks').children().length > 1) dragged_task.closest('.sidebarTask').remove()
    else dragged_task.closest('.day').remove()
}

function get_from_project(new_goal_index, drag_sidebar_task){
    let todos = $('#main .todo')
    let sidebar_pos = $('#rightbar .todo').index(drag_sidebar_task)

    $('.todoId').eq(new_goal_index).text(todos.length - 1)
    todos.eq(new_goal_index).append(project_emblem_html(project_pos))
    window.goalsAPI.getFromProject({date: l_date.day_sql, sidebar_pos: sidebar_pos, main_pos:new_goal_index})

    if ($('.sideProjectOption').eq(2).css('background-color') === 'rgb(0, 34, 68)') $(drag_sidebar_task).remove()
    else{
        drag_sidebar_task.append(already_emblem_HTML())
    }
}

export function _change_order() {
    let goals = $('#main .todoId')
    let order = []
    for (let i = 0; i < goals.length ; i++) order.push(goals.eq(i).text())
    window.goalsAPI.rowsChange({after: order})

}


export function build_view(main, header) {
    let html = `
        <div id="onTopMain"></div>
        <div id="mainBlur"></div>
        ${header}
        ${main}
    `
    $('#main').html(html)
}

function _day_view_main() {
    return `
    <div id="content">
        <div id="todosAll">
            <div id="todosArea">
            
            </div>
            <div id="finishedButton">
                <img id="finishedImg" src="images/goals/down.png" alt="up"><span>Finished: </span><span
                    id="finishedCount">0</span>
            </div>
            <div id="todosFinished">
            
            </div>
        </div>
        ${_input_html()}
    </div>
    `
}

function _day_view_header() {
    window.goalsAPI.askProjectsInfo()

    let main_title = l_date.get_day_view_header()
    let date = l_date.get_display_format(l_date.day_sql)
    return `
        <div id="header">
            <div id="mainTitle">${main_title}</div>
    
            <div id="projectShowed">
                <img src="images/goals/projects/project.png">
                <div id="projectTypes">
    
                </div>
            </div>
    
            <div id="sideOptions">
                <div id="sideHistory">
                    <img src="images/goals/history.png" alt="main">
                </div>
                <div class="sidebars">
                    <div id="sideIdeas">
                        <img src="images/goals/idea.png" alt="second" width="40" height="40">
                    </div>
                </div>
            </div>
    
            <div id="subHeader">
                <span id="date">
                    ${date}
                </span>
            </div>
            <div id="dashOpen">
                <img src="images/goals/right_arrow.png">
            </div>
        </div>
    `
}

export function _input_html() {
    let categories_html = _build_categories()

    return `
        <div id="todoInput">
            <div id="repeatPicker">
                <div class="repeatOption">
                    <div class="repeatCount">1</div>
                    <div class="repeatLabel">Every day</div>
                </div>
                <div class="repeatOption">
                    <div class="repeatCount">7</div>
                    <div class="repeatLabel">Every week</div>
                </div>
                <div class="repeatOption">
                    <div class="repeatCount">31</div>
                    <div class="repeatLabel">Every month</div>
                </div>
            </div>
        
            <div id="todoEntrySimple">
                <input id="todoEntryGet" type="text" spellcheck="false" placeholder="Result">
                <div id="todoRepeat"><img id="repeatImg" src="images/goals/repeat.png" alt=""></div>
                <div id="todoAdd">+</div>
            </div>
            <div id="todoEntryComplex">
                <div id="newSteps">
                    <div class="newStepText"><input type="text" class="stepEntry" placeholder="Action 1"></div>
                </div>
                <div id="todoSettings">
                    <div class="todoLabel">Category</div>
                    <div id="selectCategory" class="selectCategory">General</div>
                    <div class="todoLabel" id="label1">Difficulty</div>
                    <input type="range" class="todoRange" id="range1" min="0" max="4">
                    <div class="todoLabel" id="label2">Importance</div>
                    <input type="range" class="todoRange" id="range2" min="0" max="4">   
                    <div class="categoryPicker" id="categoryPicker">
                        ${categories_html}
                    </div>
                </div>
            </div>
        </div>
    `
}



function _repeat_html(knot_id) {
    let repeat = ""
    if (knot_id !== null) {
        repeat = `
            <div class="repeatLabelShow">
                <img class="repeatLabelImg" src="images/goals/repeat.png" alt="">
            </div>`
    }
    return repeat
}

function _new_goal_dict(goal_text, steps) {
    let difficulty = $('#range1').val()
    let importance = $('#range2').val()

    let new_category = getIdByColor(categories, $('#selectCategory').css('backgroundColor'))

    return {
        goal: goal_text,
        steps: _steps_html(steps, new_category),
        category: new_category,
        importance: importance,
        difficulty: difficulty,
        knot_id: repeat_option
    }
}

function _new_goal_steps() {
    let steps = []

    let steps_elements = $('.stepEntry')
    for (let i = 0; i < steps_elements.length; i++) {
        let step_value = steps_elements[i].value
        if (step_value !== "") steps.push({
            step_text: step_value.replace(/'/g, "`@`").replace(/"/g, "`@@`"),
            step_check: 0
        })
    }

    if (steps.length) {
        input_count = 0
        $('#newSteps').html(`<div class="newStepText"><input type="text" class="stepEntry" placeholder="Action 1"></div>`)
    }

    return steps
}


export function _steps_html(steps, category_id) {
    let category_color = categories[category_id][0]
    let steps_HTML = ""
    if (steps.length > 0) {
        let checks_counter = steps.reduce((total, step) => total + step.step_check, 0);

        steps_HTML =
            `<div class='stepsShow' style="background: ${category_color}">
                <img class='showImg' src='images/goals/down.png' alt="">
                <span class="check_counter">
                    <span class="counter">${checks_counter}</span>/<span class="maxCounter">${steps.length}</span>
                </span>
            </div>
            <div class='steps'>`

        for (let i = 0; i < steps.length; i++) {
            let step_check = steps[i].step_check ? "checked" : ""

            let converted_step = steps[i].step_text.replace(/`@`/g, "'").replace(/`@@`/g, '"')
            steps_HTML +=
                `<div class='step'>
                    <input type='checkbox' ${step_check} class='stepCheck'> <span class="step_text">${converted_step}</span>
                </div>`
        }
        steps_HTML += "</div>"
    }
    return steps_HTML
}

export function _build_categories() {
    let categories_html = ""
    for (let i = 0; i < Object.keys(categories).length; i++) {
        categories_html +=
            `<div class="category">
                <span class="categoryButton" style="background: ${categories[i + 1][0]}"></span>
                <span class="categoryName">${categories[i + 1][1]}</span>
            </div>`
    }
    return categories_html
}


$(document).on('click', '#dashClose', () => hide_dashboard())

function hide_dashboard() {
    $('#dashboard').toggle()
    $('#dashOpen').toggle();
}

$(document).on('click', '#dashOpen', () => show_dashboard())

function show_dashboard() {
    $('#dashboard').toggle();
    $('#dashOpen').toggle();
}

export function set_block_prev_drag_day(option) {
    block_prev_drag = option
}

export function set_todo_dragged(bool) {
    todo_dragged = bool
}



// document.getElementById("laurels").addEventListener('click', () => {
//     window.appAPI.changeWindow()
// })
