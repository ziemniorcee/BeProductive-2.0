import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {weekdays2, categories, categories2} from "./data.mjs";
import {day_view} from "./render.mjs";

$(document).on('click', '#viewMonth', function () {
    $('#content').css('flexDirection', 'column')

    $('#todayButton .dateButtonText').text('This month')
    $('#tomorrowButton .dateButtonText').text('Next month')
    $('#otherButton .dateButtonText').text('More months')

    show_hide_sidebar(true)

    window.goalsAPI.askMonthGoals({dates: l_date.get_sql_month()})
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
                    goals += `
                    <div class="monthTodo" style="background-color: ${categories2[goals_dict[day][k][1] - 1]}">
                        <div class="monthTodoId">${goal_counter}</div>
                        <div class="monthTodoLabel" style="background-color: ${categories[goals_dict[day][k][1]][0]}"></div>
                        <div class="monthTodoText" >${goals_dict[day][k][0]}</div>
                    </div>`

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

    dragula(Array.from($('.monthGoals'))).on('drop', (event) => {
        let goal_id = $(event).find('.monthTodoId').text()
        let day = Number($(event).closest('.monthDay').find('.monthDate').text())
        let date = l_date.get_sql_month_day(day)
        let day_goals = $(event).parent().children()

        let order = []
        for (let i = 0; i < day_goals.length; i++){
            order.push(Number(day_goals.eq(i).find('.monthTodoId').text()))
        }

        window.goalsAPI.changeDate({date: date, id: goal_id, order: order})
    })
    l_date.fix_header_month()
})

$(document).on('click', '.monthDay', function (){
    let day_index = Number($(this).find('.monthDate').text())
    l_date.get_sql_month_day(day_index)
    day_view()

    $('.viewOption').css('borderColor', "black")
    $('#viewDay').css('borderColor', "#FFC90E")
})