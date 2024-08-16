import {l_date} from './date.js'
import {categories, categories2, check_border, decode_text, encode_text, getIdByColor, hsvToRgb, weekdays2, projects, project_conn} from "./data.mjs";
import {change_category, close_edit, set_goal_pos} from "./edit.mjs";
import {
    already_emblem_HTML,
    build_project_goal, project_emblem_html,
    project_pos
} from "./project.mjs";
import { create_today_graphs } from './graph.mjs';


export let todo_dragged = false
let block_prev_drag = 0


window.addEventListener('DOMContentLoaded', function () {
    window.goalsAPI.askCategories();
});

window.goalsAPI.getCategories((cats) => wait_for_categories(cats));

window.goalsAPI.getAllProjects((projects) => wait_for_projects(projects));

window.goalsAPI.getGalacticConnections((connections) => wait_for_galactic_connections(connections));

function wait_for_categories(cats) {
    for (let c of cats) {
        categories[c.id] = [`rgb(${c.r}, ${c.g}, ${c.b})`, c.name];
        categories2[c.id] = `rgb(${Math.min(Math.floor(c.r * 4 / 3), 255)}, 
                                ${Math.min(Math.floor(c.g * 4 / 3), 255)}, 
                                ${Math.min(Math.floor(c.b * 4 / 3), 255)})`;
    }
    window.goalsAPI.askAllProjects();
}

function wait_for_projects(projs) {
    for (let proj of projs) {
        projects.push(proj);
    }
    console.log(projects);
    window.goalsAPI.askGalacticConnections();
}

function wait_for_galactic_connections(connections) {
    for (let conn of connections) {
        project_conn.push(conn);
    }
    console.log(project_conn);
    day_view();
    create_today_graphs();
    $('#graphLine1').show();
}

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
 * builds view, gets goals, allows drag&drop and closes edit
 */
export function day_view() {
    window.goalsAPI.askGoals({date: l_date.day_sql})
    build_view(_day_content_HTML(), _day_header_HTML())
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
function get_goals(goals) {
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_HTML(goals[i].steps, goals[i].category)
        goals[i]['goal'] = decode_text(goals[i]['goal'])

        let todo_area = goals[i]['check_state'] ? "#todosFinished" : "#todosArea";
        $(todo_area).append(build_goal(goals[i]))
    }

    build_finished_count()
}

/**
 * Counts goals finished goals
 * if there are finished goals it adds button for finished goals
 */
function build_finished_count() {
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
    let repeat = goal.knot_id ? _repeat_label_HTML() : "";
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
        let repeat_option = get_repeat_option()
        let steps = _new_goal_steps()
        let goal = _new_goal_dict(goal_text, steps, repeat_option)

        if (!$('#projectHeader').length) {
            $('#todosArea').append(build_goal(goal))
            goal['project_pos'] = -1
        } else {
            $('#projectTodo .projectSectionGoals').append(build_project_goal(goal))
            goal['project_pos'] = project_pos
        }

        goal['goal'] = encode_text(goal_text)
        goal['steps'] = steps
        goal['dates'] = l_date.get_repeat_dates(repeat_option)

        window.goalsAPI.newGoal(goal)
    }
}

/**
 * Gets repeat option from current repeat option
 * @returns {number}
 */
function get_repeat_option() {
    let repeat_path = $('#repeatImg').attr('src')
    let lastDotIndex = repeat_path.lastIndexOf('.');
    return Number(repeat_path[lastDotIndex - 1])
}

// removing functions
(function () {
    let selected_div = null

    /**
     * opens context menu for todo goal and saves selected goal
     */
    $(document).on('contextmenu', '#main .todo, .monthTodo', function (event) {
        if ($(this).find('.repeatLabelShow').length) window.appAPI.contextMenuOpen({repeat: 1})
        else window.appAPI.contextMenuOpen({repeat: 0, option: 0})
        selected_div = event.target
    })

    /**
     * opens context menu for sidebar goal and saves selected sidebar goal
     */
    $(document).on('contextmenu', '.sidebarTask', function (event) {
        if ($(this).parents('.historyTasks').length) window.appAPI.contextMenuOpen({repeat: 0, option: 1})
        else window.appAPI.contextMenuOpen({repeat: 0, option: 2})
        selected_div = event.target
    })

    /**
     * opens context menu for sidebar project goal and saves selected sidebar project goal
     */
    $(document).on('contextmenu', '#sideProjectGoals .todo', function (event) {
        window.appAPI.contextMenuOpen({repeat: 0, option: 3})
        selected_div = event.target
    })


    /**
     * removes goal after context menu click
     */
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

    /**
     * removes goal and asks to remove the repeat goals after context menu click
     */
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

    /**
     * removes repeating goals
     */
    window.goalsAPI.getFollowingRemoved((positions) => {
        let month_grid = $('#monthGrid')
        let elements_ids = month_grid.length ? $('.monthTodoId') : $('.todoId')
        let todo_type = month_grid.length ? '.monthTodo' : '.todo'

        let saved = []
        for (let i = 0; i < elements_ids.length; i++) {
            if (positions.includes(Number(elements_ids.eq(i).text()))) {
                elements_ids.eq(i).closest(todo_type).remove()
            } else saved.push(Number(elements_ids.eq(i).text()))
        }
        saved = saved.sort()

        elements_ids = month_grid.length ? $('.monthTodoId') : $('.todoId')
        for (let i = 0; i < elements_ids.length; i++) {
            elements_ids.eq(i).text((saved.indexOf(Number(elements_ids.eq(i).text()))))
        }
    })

    /**
     * removes history goal
     */
    window.sidebarAPI.removingHistory(() => {
        window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(selected_div)})
        if ($(selected_div).closest('.historyTasks').children().length === 1) {
            selected_div = $(selected_div).closest('.day')
        }
        selected_div.remove()
    })

    /**
     * removes idea goal
     */
    window.sidebarAPI.removingIdea(() => {
        window.sidebarAPI.ideaRemoved({id: $('.sidebarTask').index(selected_div)})
        selected_div.remove()
    })

    /**
     * removes project goal
     */
    window.sidebarAPI.removingProjectGoal(() => {
        window.sidebarAPI.projectGoalRemoved({id: $('#sideProjectGoals .todo').index(selected_div)})
        selected_div.remove()
    })
})();


$(document).on('click', ".repeatOption", function (event) {
    event.stopPropagation()
    select_repeat_option(this)
})

/**
 * selects repeat option
 * checks current repeat option, if the same repeat cancels
 * if different or was no option it gets selected
 * @param that selected repeat option
 */
function select_repeat_option(that) {
    let new_repeat = $('.repeatOption').index(that)
    let current_repeat = get_repeat_option()

    $("#repeatPicker").toggle()

    if (!isNaN(current_repeat) && current_repeat === new_repeat) {
        $(".repeatOption").css("background-color", "#282828")
        $('#repeatImg').attr('src', `./images/goals/repeat.png`)
    } else {
        $(".repeatOption").css("background-color", "#282828")
        $(that).css("background-color", "#3E3C4B")
        $('#repeatImg').attr('src', `./images/goals/repeat${new_repeat}.png`)
    }
}


$(document).on('click', '#newCategoryCreate', function () {
    create_new_category();
    $("#newCategory").css('display', 'none');
    $("#vignette").css('display', 'none');
})

/**
 * Creates new category from newCategory box and resets categories pickers
 */
function create_new_category() {
    let rgb = hsvToRgb($('#newCategoryColor').val() * 2, 0.7, 0.7);
    console.log(rgb);
    const len = Object.keys(categories).length + 1;
    let index = len;
    for (let i = 1; i < len; i++) {
        if (!(i in categories)) {
            index = i;
            break;
        }
    }
    let name = $('#newCategoryName').val();
    categories[index] = [`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, name];
    categories2[index] = `rgb(${Math.min(rgb[0] * 5 / 3, 255)}, 
                            ${Math.min(rgb[1] * 5 / 3, 255)}, 
                            ${Math.min(rgb[2] * 5 / 3, 255)})`;
    
    window.goalsAPI.addCategory({id: index, name: name, r: rgb[0], g: rgb[1], b: rgb[2]});
    $('#newCategoryName').val('');
    let html_categories = _categories_HTML();
    $('#categoryPicker').empty();
    $('#categoryPicker2').empty();
    $('#categoryPicker3').empty();
    $('#categoryPicker').html(html_categories);
    $('#categoryPicker2').html(html_categories);
    $('#categoryPicker3').html(html_categories);
}

$(document).on('click', '.category', function (event) {
    event.stopPropagation();
    select_category(this)
});

/**
 * Checks which category picker and by cetegory id it sets category selection
 * @param that selected cateogry
 */
function select_category(that) {
    let index = $(that).closest('.categoryPicker').find('.category').index(that) + 1
    let select_category = $('#selectCategory')
    if ($(that).closest('.categoryPicker').attr('id') === "categoryPicker") {
        select_category = $('#selectCategory')
        $('#categoryPicker').css('display', 'none')
    } else if ($(that).closest('.categoryPicker').attr('id') === "categoryPicker2") {
        select_category = $('#selectCategory2')
        $('#categoryPicker2').css('display', 'none')
        if (index !== 1) change_category(index)
    } else if ($(that).closest('.categoryPicker').attr('id') === "categoryPicker3") {
        select_category = $('#selectCategory3')
        $('#categoryPicker3').css('display', 'none')
    }
    if (index === 1) {
        $("#vignette").css('display', 'block')
        $("#newCategory").css('display', 'block')
    } else {
        select_category.css('background', categories[index - 1][0])
        select_category.text(categories[index - 1][1])
    }
}


$(document).on('click', '.stepsShow', (event) => show_steps(event));

/**
 * switches css steps of goal
 * resets drag
 * @param event1
 */
function show_steps(event1) {
    const steps = $(event1.target).closest(".taskText").find('.steps')
    let show = steps.css("display") === "block"
    steps.css("display", show ? 'none' : 'block')
    $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
    dragula_day_view()
}


/**
 * fires when new step has to be created in input
 */
$(document).on('change', '.stepEntry', function () {
    new_step_entry(this)
});

/**
 * make new step entry in new goal input if edited is current last entry
 * @param that selected step entry in new goal input
 */
function new_step_entry(that) {
    let input_count = $(".stepEntry").length
    if ($('.stepEntry').index(that) === input_count - 1) {
        $('#newSteps').append(`
            <div class="newStepText">
                <input type='text' class='stepEntry' placeholder="Action ${input_count + 1}">
            </div>`)
    }
}

$(document).on('keydown', '.stepEntry', function (event) {
    change_step_entry(this, event)
});

/**
 * step change in new goal input for tab click
 * if tab is from the last and value is not empty, step entry it creates new step and go to it
 * else if the value is empty it does nothing
 * @param that selected step in new goal input
 * @param event event of .stepEntry
 */
function change_step_entry(that, event){
    if (event.which === 9) {
        let step_entry = $('.stepEntry')
        if (step_entry.index(that) === step_entry.length - 1 && $(that).val() !== "") {
            event.preventDefault();

            $('#newSteps').append(`
                <div class="newStepText">
                    <input type='text' class='stepEntry' placeholder="Action ${step_entry.length + 1}">
                </div>`)

            step_entry = $('.stepEntry')
            step_entry.eq(step_entry.length - 1).focus()
        } else if ($(that).val() === "") {
            event.preventDefault();
        }
    }
}

$(document).on('click', '#todosAll .check_task', function () {
    let position = $('.check_task').index(this)
    change_main_check(position)
});


/**
 * changes check of goals
 * @param position selected goal position
 */
export function change_main_check(position) {
    const check_task = $('.check_task').eq(position)
    const dot = $('.checkDot').eq(position)
    let todo = $('.todo')
    let goal_id = $('.todoId')

    if ($('#monthGrid').length) {
        goal_id = $('.monthTodoId')
        todo = $('.monthTodo')
    }

    let state = Number(check_task.prop('checked'))

    let category_color = $(dot).css('borderColor')
    $(dot).replaceWith(`<div class="checkDot" style="background-image: ${state ? "url('images/goals/check.png')" : ""}; border-color:${category_color}">`)
    check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task'>`)
    $(state ? "#todosFinished" : "#todosArea").append(todo.eq(position).prop("outerHTML"))
    todo.eq(position).remove()

    let new_tasks = goal_id.map(function () {
        return $(this).text();
    }).get()

    let array_id = Number(goal_id.eq(position).html())
    window.goalsAPI.changeChecksGoal({id: array_id, state: state})
    if ($('#todosAll').length) window.goalsAPI.rowsChange({after: new_tasks})

    build_finished_count()
    dragula_day_view()
}


$(document).on('click', '.stepCheck', function () {
    change_step_check(this)
});

/**
 * changes check of selected step
 * @param that selected step
 */
function change_step_check(that){
    const step_check = $('.stepCheck')
    let step_id_rel = $(that).closest('.step').index()
    let goal_id = $(that).closest('.todo').find('.todoId').text()

    let step_id_unrel = step_check.index(that)
    let counter_html = $(that).closest(".todo").find('.counter').get(0)
    if (that.checked) {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' checked class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) + 1
    } else {
        step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' class='stepCheck'>")
        counter_html.innerText = Number(counter_html.innerText) - 1
    }

    window.goalsAPI.changeChecksStep({id: goal_id, step_id: step_id_rel, state: Number(that.checked)})
    dragula_day_view()
}

$(document).on('click', '.sidebarTask', function () {
    block_prev_drag = 0
})

/**
 * Sets drag and drop for day view
 * if edit in not on rightbar resets
 * depends if project sidebar is on, dragula elements are selected
 */
export function dragula_day_view() {
    block_prev_drag = 0
    let dragged_task
    let dragula_array
    let todos_area_before

    let rightbar = $('#rightbar')
    let is_project_sidebar = $('#sideProjectHeader').length

    rightbar.html(rightbar.html())
    if (is_project_sidebar) {
        dragula_array = Array.from($('#sideProjectGoals')).concat([document.querySelector("#todosArea")])
    } else {
        dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])
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

        if (todos_area_after.length !== todos_area_before.length) {
            if (dragged_task.attr('class') === "sidebarTask") _get_from_history(dragged_task)
            else if (dragged_task.parent().attr('id') === "sideProjectGoals") {
                _get_from_project(new_goal_pos, dragged_task)
            }
        } else {
            change_order()
        }
    });
}

/**
 * Gets goal from history by drag
 * @param dragged_task dragged history task
 */
function _get_from_history(dragged_task) {
    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(dragged_task), date: l_date.day_sql})

    if (dragged_task.closest('.historyTasks').children().length > 1) dragged_task.closest('.sidebarTask').remove()
    else dragged_task.closest('.day').remove()
}

/**
 * gets goal from project sidebar by drag
 * @param new_goal_index new position of goal
 * @param dragged_task selected goal
 */
function _get_from_project(new_goal_index, dragged_task) {
    let todos = $('#main .todo')
    let sidebar_pos = $('#rightbar .todo').index(dragged_task)

    $('.todoId').eq(new_goal_index).text(todos.length - 1)
    todos.eq(new_goal_index).append(project_emblem_html(project_pos))
    window.goalsAPI.getFromProject({date: l_date.day_sql, sidebar_pos: sidebar_pos, main_pos: new_goal_index})

    if ($('.sideProjectOption').eq(2).css('background-color') === 'rgb(0, 34, 68)') $(dragged_task).remove()
    else {
        dragged_task.append(already_emblem_HTML())
    }
}

/**
 * fixes order of goals and saves it
 */
export function change_order() {
    console.log("chuj")
    let goals = $('#main .todoId')
    let order = []
    for (let i = 0; i < goals.length; i++) order.push(goals.eq(i).text())
    window.goalsAPI.rowsChange({after: order})

}

/**
 * Builds view from given components
 * @param content HTML main part of todo view
 * @param header HTML head part of todo view
 */
export function build_view(content, header) {
    let html = `
        <div id="onTopMain"></div>
        <div id="mainBlur"></div>
        ${header}
        ${content}`

    $('#main').html(html)
}

/**
 * creates body of day view
 * @returns {string} HTML of content
 */
function _day_content_HTML() {
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
        ${_input_HTML()}
    </div>`
}

/**
 * creates head of day view
 * @returns {string} HTML of header
 */
function _day_header_HTML() {
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
        </div>`
}

/**
 * creates input field for goals
 * @returns {string} HTML of input
 */
export function _input_HTML() {
    let categories_html = _categories_HTML()

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


/**
 * creates repeat label
 * @returns {string} HTML of repeat label
 */
export function _repeat_label_HTML() {
    return `
        <div class="repeatLabelShow">
            <img class="repeatLabelImg" src="images/goals/repeat.png" alt="">
        </div>`
}

/**
 * creates dictionary of goal settings
 * @param goal_text goal name
 * @param steps steps settings
 * @param repeat repeat option
 * @returns dict of goal parameters
 */
function _new_goal_dict(goal_text, steps, repeat) {
    let difficulty = $('#range1').val()
    let importance = $('#range2').val()

    let new_category = getIdByColor(categories, $('#selectCategory').css('backgroundColor'))
    return {
        goal: goal_text,
        steps: _steps_HTML(steps, new_category),
        category: new_category,
        importance: importance,
        difficulty: difficulty,
        knot_id: !isNaN(repeat)
    }
}

/**
 * creates steps ready to goal building
 * @returns {array} array of steps from new goal creatiion
 */
function _new_goal_steps() {
    let steps = []

    let steps_elements = $('.stepEntry')
    for (let i = 0; i < steps_elements.length; i++) {
        let step_value = steps_elements[i].value
        if (step_value !== "") steps.push({
            step_text: encode_text(step_value),
            step_check: 0
        })
    }

    if (steps.length) {
        $('#newSteps').html(`
            <div class="newStepText">
                <input type="text" class="stepEntry" placeholder="Action 1">
            </div>`)
    }

    return steps
}


/**
 * creates steps for goal from given steps data and category of goal
 * @param steps steps data
 * @param category_id id of category color
 * @returns {string} HTML of
 */
export function _steps_HTML(steps, category_id) {
    let steps_HTML = ""
    if (steps.length > 0) {
        let checks_counter = steps.reduce((total, step) => total + step.step_check, 0);

        let steps_elements = ""
        for (let i = 0; i < steps.length; i++) {
            let step_check = steps[i].step_check ? "checked" : ""
            let converted_step = decode_text(steps[i].step_text)
            steps_elements +=
                `<div class='step'>
                    <input type='checkbox' ${step_check} class='stepCheck'> <span class="step_text">${converted_step}</span>
                </div>`
        }

        let category_color = categories[category_id][0]
        steps_HTML =
            `<div class='stepsShow' style="background: ${category_color}">
                <img class='showImg' src='images/goals/down.png' alt="">
                <span class="check_counter">
                    <span class="counter">${checks_counter}</span>/<span class="maxCounter">${steps.length}</span>
                </span>
            </div>
            <div class='steps'>
                ${steps_elements}
            </div>`
    }
    return steps_HTML
}

/**
 * creates categories for goals
 * @returns {string} HTML of categories
 */
export function _categories_HTML() {
    let categories_html = ""
    categories_html +=
            `<div class="category">
                <span class="categoryButton" style="background: rgb(93, 93, 93)"></span>
                <span class="categoryName">New Category</span>
            </div>`
    for (let i = 0; i < Object.keys(categories).length; i++) {
        categories_html +=
            `<div class="category">
                <span class="categoryButton" style="background: ${categories[i + 1][0]}"></span>
                <span class="categoryName">${categories[i + 1][1]}</span>
            </div>`
    }
    return categories_html
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


