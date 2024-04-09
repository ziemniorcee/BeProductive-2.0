import {l_date} from "./date.js";
import {categories, check_border, weekdays2, weekdays_grid} from "./data.mjs";
import {day_view, set_todo_dragged} from "./render.mjs";
import {set_goal_pos} from "./edit.mjs";


$(document).on('click', '#viewWeek', function () {
    $('#todayButton .dateButtonText').text('This week')
    $('#tomorrowButton .dateButtonText').text('Next week')
    $('#otherButton .dateButtonText').text('More week')

    l_date.fix_header_week()
    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
    window.sidebarAPI.askHistory({date: l_date.week_current[0]})
})

$(document).on('mousedown', '.weekDay', function () {
    let day_index = weekdays2.indexOf($(this).find('.weekDayText').text())
    l_date.get_week_day(day_index)
    day_view()

    $('.viewOption').css('borderColor', "black")
    $('#viewDay').css('borderColor', "#FFC90E")
})

window.goalsAPI.getWeekGoals((goals) => {
    let today_sql = l_date.sql_format(l_date.today)
    let content = $('#content')
    content.css('flexDirection', 'row')

    let html = ""
    let todo_id = 0

    for (let i = 0; i < 4; i++) {
        let days = ""
        for (let j = 0; j < weekdays_grid[i].length; j++) {
            let sql_date = l_date.week_now[i + j * 3]
            let goals_html = ""

            for (let goal_index = 0; goal_index < goals.length; goal_index++) {
                if (goals[goal_index].addDate === sql_date) {
                    goals_html += build_week_goal(goals[goal_index], todo_id)
                    todo_id++;
                }
            }

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
                    <div class="${classes}" id="${weekdays_grid[i][j]}">${goals_html}</div>
                </div>`
        }

        html += `
            <div class="weekViewColumn">
                ${days}
            </div>`
    }

    content.html(html)
})

let block_prev_drag = 0

$(document).on('click', '.sidebarTask', function () {
    block_prev_drag = 0
})

export function dragula_week_view() {
    block_prev_drag = 0
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.weekDayGoals')))

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
        drag_sidebar_task = $(event)
        set_todo_dragged(true)
        block_prev_drag = 0
    }).on('drop', function (event) {
        let new_goal_pos = $('.todo').index($(event))
        set_goal_pos(new_goal_pos)

        if (event.className.includes("todo")) _change_order(event)
        else if (event.parentNode !== null) _get_from_sidebar(event, drag_sidebar_task)
    })
}

export function set_block_prev_drag_week(option) {
    block_prev_drag = option
}

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

function _get_from_sidebar(event, drag_sidebar_task) {
    let new_goal_pos = -1;
    let todos = $(event).closest('.weekDayGoals').children()

    for (let i = 0; i < todos.length; i++) if (todos[i].className !== "todo") new_goal_pos = i

    let week_day = $('.weekDayGoals .sidebarTask').closest('.weekDayGoals').attr("id")
    let date = l_date.week_current[weekdays2.indexOf(week_day)]
    window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: date})

    if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
    else drag_sidebar_task.closest('.day').remove()
}

$(document).on('click', '.weekDayGoals .check_task', function () {
    const goal_ids = $(`.todoId`)
    const rel_id = $('.check_task').index(this)

    $('.checkDot').eq(rel_id).css('background-image', "url('images/goals/check.png')")

    setTimeout(function () {
        $('.todo').eq(rel_id).remove()
        window.goalsAPI.changeChecksGoal({id: Number(goal_ids.eq(rel_id).html()), state: 1})
        dragula_week_view()
    }, 1000);
});


export function build_week_goal(goal, todo_id) {
    let difficulty = `images/goals/rank${goal.Difficulty}.svg`
    let check_state = ""
    let check_bg = ""

    if (goal.check_state) {
        check_state = "checked"
        check_bg = "url('images/goals/check.png')"
    }

    let converted_text = goal.goal.replace(/`@`/g, "'").replace(/`@@`/g, '"')

    return `
        <div class="todo">
            <div class="todoId">${todo_id}</div>
            <div class="todoCheck" style="background: ${categories[goal.category][0]} url(${difficulty}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px  ${check_border[goal.Importance]} solid"></div>
                <input type="checkbox" class="check_task" ${check_state}>
            </div>
            <div class="taskText"><span class="task">${converted_text}</span></div>
        </div>`;
}



