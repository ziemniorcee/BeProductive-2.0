import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {categories, check_border, weekdays, weekdays2, weekdays_grid} from "./data.mjs";
import {day_view} from "./render.mjs";


$(document).on('click', '#viewWeek', function () {
    $('#todayButton .dateButtonText').text('This week')
    $('#tomorrowButton .dateButtonText').text('Next week')
    $('#otherButton .dateButtonText').text('More week')

    l_date.fix_header_week()
    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
    window.sidebarAPI.askHistory({date: l_date.week_now[0]})
})

$(document).on('click', '.weekDay', function () {
    let day_index = weekdays2.indexOf($(this).find('.weekDayText').text())
    l_date.get_week_day(day_index)
    day_view()

    $('.viewOption').css('borderColor', "black")
    $('#viewDay').css('borderColor', "#FFC90E")
})

window.goalsAPI.getWeekGoals((goals) => {
    console.log(goals)
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
            days += `
                <div class="weekDay">
                    <div class="weekDayText">${weekdays_grid[i][j]}</div>
                    <div class="weekDayGoals" id="${weekdays_grid[i][j]}">${goals_html}</div>
                </div>`
        }

        html += `
            <div class="weekViewColumn">
                ${days}
            </div>`
    }

    content.html(html)
})

export function dragula_week_view() {
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.weekDayGoals')))

    dragula(dragula_array, {
        copy: function (el) {
            return el.className === "sidebarTask";
        },
        accepts: function (el, target) {
            return target.className !== "historyTasks";
        }
    }).on('drag', function (event) {
        drag_sidebar_task = $(event)
    }).on('drop', function (event) {
        if (event.className.includes("todo")) _change_order(event)
        else if (event.parentNode !== null) _get_from_sidebar(event, drag_sidebar_task)
    })
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

    let todo = `
        <div class="todo">
            <div class="todoId">${todo_id}</div>
            <div class="todoCheck" style="background: ${categories[goal.category][0]} url(${difficulty}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px  ${check_border[goal.Importance]} solid"></div>
                <input type="checkbox" class="check_task" ${check_state}>
            </div>
            <div class="taskText"><span class="task">${goal.goal}</span></div>
        </div>`

    return todo;
}



