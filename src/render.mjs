import {l_date} from './date.js'
import {categories, check_border, getIdByColor, weekdays2} from "./data.mjs";
import {change_category, close_edit, set_goal_pos} from "./edit.mjs";
import {build_project_goal, project_pos, reset_project_pos} from "./project.mjs";


export let todo_dragged = false
let repeat_option = null
let input_count = 0
let block_prev_drag = 0


window.addEventListener('DOMContentLoaded', function() {
    window.goalsAPI.askGoals({date: l_date.day_sql})
    window.sidebarAPI.askHistory({date: l_date.day_sql})
    build_view(_day_view_main(), _day_view_header())
});


$(document).on('click', '#dashDay', function () {
    $('.dashViewOption').css('backgroundColor', '#55423B')
    $(this).css('backgroundColor', '#FF5D00')
    $('#mainTitle').text('My day')
    day_view()
})


window.goalsAPI.getGoals((goals) => {
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_html(goals[i].steps, goals[i].category)
        goals[i]['goal'] = goals[i]['goal'].replace(/`@`/g, "'").replace(/`@@`/g, '"')

        let todo_area = goals[i]['check_state'] ? "#todosFinished" : "#todosArea";

        build_goal(goals[i])
        $(todo_area).append(build_goal(goals[i]))
    }

    let finished_count = $('#todosFinished .todo').length
    $('#finishedButton').css('display', finished_count ? "block" : "none")
    if (finished_count) $("#finishedCount").html(finished_count);
    repeat_option = null
})

export function day_view() {
    $('#content').css('flexDirection', 'column')
    reset_project_pos()

    build_view(_day_view_main(), _day_view_header())

    l_date.fix_header_day()

    window.sidebarAPI.askHistory({date: l_date.sql_format(l_date.today)})
    window.goalsAPI.askGoals({date: l_date.day_sql})
}


export function build_goal(goal) {
    let todo_id = $('.todo').length
    let category_color = categories[goal.category][0]
    let check_state = goal.check_state ? "checked" : "";
    let todo_area = goal.check_state ? "#todosFinished" : "#todosArea";
    let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
    let url = `images/goals/rank${goal.difficulty}.svg`
    let repeat = _repeat_html(goal.knot_id)
    let project_emblem = _project_emblem_html(goal.pr_pos, goal.pr_category, goal.pr_icon)

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


function new_goal() {
    let e_todo = $('#todoEntryGet')
    let goal_text = e_todo.val()
    e_todo.val('')

    if (goal_text !== "") {
        let steps = _new_goal_steps()
        let goal = _new_goal_dict(goal_text, steps)

        if (project_pos === null) $('#todosArea').append(build_goal(goal))
        else $('#projectTodo').append(build_project_goal(goal))

        goal['goal'] = goal_text.replace(/'/g, "`@`").replace(/"/g, "`@@`")
        goal['steps'] = steps
        goal['dates'] = l_date.get_repeat_dates(repeat_option)
        goal['project_pos'] = project_pos

        window.goalsAPI.newGoal(goal)
    }
}


$(document).on('click', '#todoAdd', (event) => {
    event.stopPropagation()
    new_goal()
})

$(document).on('keyup', '#todoEntrySimple', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) new_goal()
});


// removing functions
(function () {
    let selected_div = null

    $(document).on('contextmenu', '.todo, .monthTodo', function (event) {
        if ($(this).find('.repeatLabelShow').length) window.appAPI.contextMenuOpen({repeat: 1})
        else window.appAPI.contextMenuOpen({repeat: 0, option: 0})

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

export function change_check(id) {
    const check_task = $('.check_task').eq(id)
    const dot = $('.checkDot').eq(id)

    let todo = $('.todo')
    let goal_id = $('.todoId')
    if ($('#monthGrid').length) {
        goal_id = $('.monthTodoId')
        todo = $('.monthTodo')
    }

    let array_id = Number(goal_id.eq(id).html())
    let state = Number(check_task.prop('checked'))

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

    let finished_count = $('#todosFinished .todo').length
    $("#finishedButton").css('display', finished_count ? "block" : "none");
    $('#finishedCount').html(finished_count)

    if (l_date.day_sql !== l_date.today_sql) window.sidebarAPI.askHistory({date: l_date.today_sql})
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
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])

    dragula(dragula_array, {
        copy: function (el) {
            return el.className === "sidebarTask";
        },
        accepts: function (el, target) {
            block_prev_drag = 0
            return target.className !== "historyTasks";
        },
        moves: function () {
            if (block_prev_drag === 0) {
                block_prev_drag = 1
                return true
            } else return false
        },
    }).on('drag', function (event) {
        todo_dragged = true
        drag_sidebar_task = $(event)
        block_prev_drag = 0
    }).on('drop', function (event) {
        let new_goal_pos = $('.todo').index($(event))
        set_goal_pos(new_goal_pos)

        if (event.className.includes("todo")) _change_order()
        else if (event.parentNode !== null) _get_from_sidebar(drag_sidebar_task)
    });
}

export function set_block_prev_drag_day(option) {
    block_prev_drag = option
}

export function set_todo_dragged(bool) {
    todo_dragged = bool
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

function _day_view_main(){
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

function _day_view_header(){
    window.goalsAPI.askProjectsInfo()

    let date = l_date.get_display_format()
    return `
        <div id="header">
            <div id="mainTitle">My day</div>
    
            <div id="projectShowed">
                <img id="imgProjectShowed" src="images/goals/projects/project.png">
                <div id="projectTypes">
    
                </div>
            </div>
    
            <div id="sidebarType">
                <img id="imgMain" src="images/goals/history.png" alt="main">
                <div class="sidebars">
                    <img id="imgSecond" src="images/goals/idea.png" alt="second" width="40" height="40">
                </div>
            </div>
    
            <div id="subHeader">
                <span id="date">
                    ${date}
                </span>
            </div>
        </div>
    `
}

export function _input_html(){
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

function _project_emblem_html(position, category, icon){
    let project_emblem = ''
    if (position !== -1  && position !== undefined){
        let project_category_color = categories[category][0]
        project_emblem = `
            <div class="projectEmblem" style="background-color: ${project_category_color}">
                <img src="images/goals/projects/${icon}.png">
                <div class="projectPos">${position}</div>
            </div>
        `
    }
    return project_emblem
}

function _repeat_html(knot_id){
    let repeat = ""
    if (knot_id !== null) {
        repeat = `
            <div class="repeatLabelShow">
                <img class="repeatLabelImg" src="images/goals/repeat.png" alt="">
            </div>`
    }
    return repeat
}

function _new_goal_dict(goal_text, steps){
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

function _new_goal_steps(){
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

function _change_order() {
    let goals = $('.todoId')
    let order = []
    for (let i = 0; i < goals.length - 1; i++) order.push(goals.eq(i).text())
    window.goalsAPI.rowsChange({after: order})
}

function _get_from_sidebar(drag_sidebar_task) {
    let new_goal_pos = 0;
    let todos = $('#todosArea').children()

    for (let i = 0; i < todos.length; i++) if (todos[i].className !== "todo") new_goal_pos = i

    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: l_date.day_sql})

    if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
    else drag_sidebar_task.closest('.day').remove()
}


export function _show_sidebar(){
    let right_bar = $('#rightbar')
    let resizer = $('#resizer')
    if (right_bar.css('display') === 'none') {
        right_bar.toggle()
        resizer.css('display', right_bar ? 'flex' : 'none')
    }
}






// document.getElementById("laurels").addEventListener('click', () => {
//     window.appAPI.changeWindow()
// })
