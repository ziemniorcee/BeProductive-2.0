import {l_date} from "./date.js";
import {categories, check_border, decode_text, weekdays2, weekdays_grid} from "./data.mjs";
import {_repeat_label_HTML, day_view} from "./render.mjs";
import {already_emblem_HTML, project_pos, reset_project_pos} from "./project.mjs";

export let is_week_drag = 0

$(document).on('click', '#weekViewButton', function () {
    week_view()
});

/**
 * Displays week view in #main
 * builds view, gets goals, allows drag&drop and closes edit
 */
export function week_view() {
    $('#main').html('')
    _week_header_HTML()
    $('#main').append(_week_content_HTML())


    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
    window.sidebarAPI.askHistory({date: l_date.get_history_week()})

    let rightbar = $('#rightbar')
    rightbar.html(rightbar.html())

    dragula_week_view()

    $('#content').css('flex-direction', 'row')
}

window.goalsAPI.getWeekGoals((goals) => {
    get_week_goals(goals)
});

/**
 * iterates through weekdays and given goals data.
 * adds goal if current date is correct, and it removes first element
 * @param goals data of goals in week
 */
function get_week_goals(goals) {
    for (let i = 0; i < 7; i++) {
        let is_current_day = true
        while (is_current_day && goals.length) {
            if (goals[0].addDate === l_date.week_now[i]) {
                let week_day = $(`#${weekdays2[i]}`)
                week_day.append(build_week_goal(goals[0]))
                goals.shift()
            } else {
                is_current_day = false
            }
        }
    }
}

/**
 * builds week goal from given data
 * @param goal data of goal
 * @returns {string} HTML of created goal
 */
export function build_week_goal(goal) {
    let difficulty = `images/goals/rank${goal.difficulty}.svg`
    let check_state = goal.check_state ? "checked" : ""
    let check_bg = goal.check_state ? "url('images/goals/check.png')" : ""
    let converted_text = decode_text(goal.goal)
    let repeat = goal.knot_id ? _repeat_label_HTML() : "";
    let todo_id = $('#main .todo').length

    return `
        <div class="todo">
            <div class="todoId">${todo_id}</div>
            <div class="todoCheck" style="background: ${categories[goal.category][0]} url(${difficulty}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px  ${check_border[goal.importance]} solid"></div>
                <input type="checkbox" class="check_task" ${check_state}>
            </div>
            <div class="taskText">
                <span class="task">${converted_text}</span>
                ${repeat}
            </div>
        </div>`;
}

(function () {
    let mousedown_weekday = false

    $(document).on('mousedown', '.weekDay', function (event) {
        if (event.which === 1 && event.target.className.includes("weekDayGoals")) {
            mousedown_weekday = true
        }
    })

    $(document).on('mouseup', '.weekDay', function (event) {
        if (event.which === 1 && event.target.className.includes("weekDayGoals") && mousedown_weekday) {
            $('.dashViewOption').css('background-color', 'rgb(85, 66, 59)')
            $('#dashDay').css('background-color', '#FF5D00')

            let day_index = weekdays2.indexOf($(this).find('.weekDayText').text())
            l_date.get_week_day(day_index)
            day_view()

            mousedown_weekday = false
        }
    })
})();


/**
 * creates body of week view
 * it starts with columns, monday is bigger
 * @returns {string} HTML of content
 */
function _week_content_HTML() {

    let today_sql = l_date.sql_format(l_date.today)

    let week_columns = ""
    for (let i = 0; i < 4; i++) {
        let days = ""
        for (let j = 0; j < weekdays_grid[i].length; j++) {
            let sql_date = l_date.week_now[i + j * 3]

            let classes = "weekDayGoals"
            let today_label = ""
            if (sql_date === today_sql) {
                classes = "weekDayGoals weekToday"
                today_label = "<div id='todayWeekText'>Today</div>"
            }
            days += `
                <div class="weekDay">
                    ${today_label}
                    <div class="weekDayText">${weekdays_grid[i][j]}</div>
                    <div class="${classes}" id="${weekdays_grid[i][j]}"></div>
                </div>`
        }

        week_columns += `
            <div class="weekViewColumn">
                ${days}
            </div>`
    }

    return `
        <div id="content">
            ${week_columns}
        </div>`

}

/**
 * creates head of week view
 * @returns {string} HTML of header
 */
function _week_header_HTML() {
    let header_params = l_date.get_header_week()

    const header_template = $('#viewHeaderTemplate').prop('content');
    let $header_clone = $(header_template).clone()
    $header_clone.find('.viewOption').css('background-color', '#121212')
    $header_clone.find('#weekViewButton').css('background-color', '#2979FF')

    $header_clone.find('#mainTitle').text(header_params[0])
    $header_clone.find('#date').text(header_params[1])
    $('#main').append($header_clone)
}


/**
 * Allows drag & drop in week view
 * dragula array based on opened sidebar
 * drop functions are based on drop location
 * and differences between state before and after
 */
export function dragula_week_view() {
    is_week_drag = 0
    let drag_sidebar_task
    let dragula_array
    let dragged_task

    let is_project_sidebar = $('#sideProjectHeader').length
    if (is_project_sidebar) {
        dragula_array = Array.from($('#sideProjectGoals')).concat(Array.from($('.weekDayGoals')))
    } else {
        dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.weekDayGoals')))
    }

    let goals_length_before = null

    dragula(dragula_array, {
        copy: function (el) {
            return !el.parentNode.className.includes("weekDayGoals");
        },
        accepts: function (el, target) {
            is_week_drag = 0
            return target.className.includes("weekDayGoals");
        },
        moves: function (el, target) {
            let is_in = $(el).find('.alreadyEmblem').length
            let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'
            if (is_week_drag === 0 && is_in === 0 && !is_done) {
                is_week_drag = 1
                return true
            } else return false
        },
    }).on('drag', function (event) {
        drag_sidebar_task = $(event)
        is_week_drag = 0

        goals_length_before = $('#main .goals').length
    }).on('drop', function (event) {
        let todos = $('#main .goals')
        let goals_length_after = todos.length
        let new_goal_pos = todos.index($(event))

        if (event.className.includes("todo")) {
            if (goals_length_before !== goals_length_after) {
                _get_from_project(event, new_goal_pos, drag_sidebar_task)
            } else if (drag_sidebar_task.parent().attr('id') !== "sideProjectGoals") {
                _change_order(event)
            }
        } else if (event.parentNode !== null) _get_from_sidebar(event, drag_sidebar_task)

    })
}

/**
 * imports goal from project sidebar
 * @param event event of dropped task
 * @param new_goal_pos new position of dropped task
 * @param dragged_task drag event of the task
 */
function _get_from_project(event, new_goal_pos, dragged_task) {
    let sidebar_pos = $('#rightbar .goals').index(dragged_task)
    let new_goal_index = $('.weekDayGoals .goals').index(event)

    let display_week_day = $('.weekDayGoals').index(event.parentNode)
    let real_week_day = weekdays2.indexOf($('.weekDayText').eq(display_week_day).text())
    let add_date = l_date.week_now[real_week_day]

    let is_sidebar_to_delete = $('.sideProjectOption').eq(2).css('background-color') === 'rgb(0, 34, 68)'
    window.goalsAPI.getFromProject({
        date: add_date,
        sidebar_pos: sidebar_pos,
        main_pos: new_goal_index,
        to_delete: is_sidebar_to_delete
    })
    if (is_sidebar_to_delete) $(dragged_task).remove()
    else $(dragged_task).append(already_emblem_HTML())
    $('#main .todoId').eq(new_goal_pos).text($('#main .goals').length - 1)
}


/**
 * Fixes order based on goals positions
 * @param event drop state of goals
 */
function _change_order(event) {
    let day_id = weekdays2.indexOf($(event.parentNode).attr('id'))
    let date = l_date.week_now[day_id]
    let goal_id = $(event).find('.todoId').text()

    let order = []
    let week_day = $(event.parentNode).children()
    for (let i = 0; i < week_day.length; i++) {
        order.push(Number(week_day.eq(i).find('.todoId').text()))
    }

    window.goalsAPI.changeDate({date: date, id: goal_id, order: order})
}

/**
 * imports goal from sidebar
 * @param event drop event of dragula
 * @param drag_sidebar_task dragged task from sidebar
 */
function _get_from_sidebar(event, drag_sidebar_task) {
    let new_goal_pos = -1;
    let todos = $(event).closest('.weekDayGoals').children()

    for (let i = 0; i < todos.length; i++) {
        if (todos[i].className !== "todo") new_goal_pos = i
    }

    let week_day = $('.weekDayGoals .sidebarTask').closest('.weekDayGoals').attr("id")
    let date = l_date.week_current[weekdays2.indexOf(week_day)]

    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: date})

    if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
    else drag_sidebar_task.closest('.day').remove()
}

$(document).on('click', '.weekDayGoals .check_task', function () {
    check_week_goal(this)
});

/**
 * Changes check on week goals and fixes goals ids
 * @param that selected check in week view
 */
function check_week_goal(that){
    const goal_ids = $(`#main .todoId`)
    const rel_id = $('.check_task').index(that)
    $('.checkDot').eq(rel_id).css('background-image', "url('images/goals/check.png')")

    setTimeout(function () {
        let todos = $('#main .goals')
        todos.eq(rel_id).remove()
        window.goalsAPI.changeWeekGoalCheck({id: Number(goal_ids.eq(rel_id).html()), state: 1})
        dragula_week_view()
        let new_ids = $(`#main .todoId`)
        for (let i = 0; i < new_ids.length; i++){
            new_ids.eq(i).text(i)
        }

        if (l_date.week_now !== l_date.week_current) window.sidebarAPI.askHistory({date: l_date.week_current[0]})
    }, 1000);
}

$(document).on('click', '.sidebarTask', function () {
    is_week_drag = 0
})

export function set_block_prev_drag_week(option) {
    is_week_drag = option
}
