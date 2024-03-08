import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {weekdays2, categories, categories2} from "./data.mjs";
import {day_view} from "./render.mjs";

$(document).on('click', '#viewMonth', function () {
    $('#content').css('flexDirection', 'column')

    $('#todayButton .dateButtonText').text('This month')
    $('#tomorrowButton .dateButtonText').text('Next month')
    $('#otherButton .dateButtonText').text('More months')

    window.goalsAPI.askMonthGoals({dates: l_date.get_sql_month()})
    window.sidebarAPI.askHistory({date: l_date.history_sql})
})

window.goalsAPI.getMonthGoals((goals_dict) => {
    let month_params = l_date.get_format_month()
    let month_counter = 0;
    let goal_counter = 0;

    let html = ""

    let header = ""
    for (let i = 0; i < 7; i++) {
        header += `
            <div class="monthWeekDay">
                ${weekdays2[i]}
            </div>`
    }

    let grid = ""
    for (let i = 0; i < 5; i++) {
        let week = ""

        for (let j = 0; j < 7; j++) {
            let display = "hidden"
            if (month_counter >= month_params[0] && month_counter < month_params[1]) display = "visible"
            let day = month_counter - month_params[0] + 1
            let goals = ""

            if (goals_dict[day] !== undefined) {
                for (let k = 0; k < goals_dict[day].length; k++) {
                    goals += build_month_goal(goals_dict[day][k], goal_counter)
                    goal_counter++
                }
            }

            week += `
                <div class="monthDay" style="visibility: ${display}">
                    <div class="monthDate">${day < 10 ? "0" + day : day}</div>
                    <div class="monthGoals">
                        ${goals}
                    </div>
                </div>`

            month_counter++
        }
        grid += `
            <div class="monthWeek">
                ${week}
            </div>`
    }

    $('#content').html(`
        <div id="monthHeader">
            ${header}
        </div>
        <div id="monthGrid">
            ${grid}
        </div>
    `)

    l_date.fix_header_month()
})

export function build_month_goal(goals_dict, goal_counter) {
    let goal = `
        <div class="monthTodo" style="background-color: ${categories2[goals_dict['category'] - 1]}">
            <div class="monthTodoId">${goal_counter}</div>
            <div class="monthTodoLabel" style="background-color: ${categories[goals_dict['category']][0]}"></div>
            <div class="monthTodoText" >${goals_dict['goal']}</div>
        </div>`
    return goal
}

export function dragula_month_view() {
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.monthGoals')))

    dragula(dragula_array, {
        copy: function (el) {
            return el.className === "sidebarTask";
        },
        accepts: function (el, target) {
            return target.className !== "historyTasks";
        }
    }).on('drag', function (event) {
        drag_sidebar_task = $(event)
    }).on('drop', (event) => {
        if (event.className.includes("monthTodo")) {
            let goal_id = $(event).find('.monthTodoId').text()
            let day = Number($(event).closest('.monthDay').find('.monthDate').text())
            let date = l_date.get_sql_month_day(day)
            let day_goals = $(event).parent().children()

            let order = []
            for (let i = 0; i < day_goals.length; i++) {
                order.push(Number(day_goals.eq(i).find('.monthTodoId').text()))
            }

            window.goalsAPI.changeDate({date: date, id: goal_id, order: order})
        } else if (event.parentNode !== null) {
            let new_goal_pos = -1;
            let todos = $(event).closest('.monthGoals').children()
            for (let i = 0; i < todos.length; i++) if (todos[i].className !== "monthTodo") new_goal_pos = i

            let month_day = Number($('.monthGoals .sidebarTask').closest('.monthDay').find('.monthDate').text())
            let date = l_date.get_sql_month_day(month_day)

            window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: date})
            if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
            else drag_sidebar_task.closest('.day').remove()
        }
    })
}

$(document).on('click', '.monthDay', function () {
    let day_index = Number($(this).find('.monthDate').text())
    l_date.set_sql_month(day_index)
    day_view()

    $('.viewOption').css('borderColor', "black")
    $('#viewDay').css('borderColor', "#FFC90E")
})