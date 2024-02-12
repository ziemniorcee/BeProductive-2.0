import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {categories, check_border} from "./data.mjs";

$(document).on('click', '#viewWeek', function () {
    show_hide_sidebar()

    let dates = []
    for(let i = 0; i < 7; i++){
        dates.push(l_date.weekday_sql(i))
    }
    console.log(dates[0], dates[6])
    window.goalsAPI.askWeekGoals({dates: dates})
})


window.goalsAPI.getWeekGoals((goals) => {
    $('#content').css('flexDirection', 'row')

    const weekdays = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];
    const weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    let html = ""
    let todo_id = 0

    for (let i = 0; i < 4; i++) {
        let days = ""
        for (let j = 0; j < weekdays[i].length; j++) {
            let sql_date = l_date.weekday_sql(i + j * 3)
            let goals_html = ""

            for (let goal_index = 0; goal_index < goals.length; goal_index++) {
                if (goals[goal_index].addDate === sql_date) {
                    goals_html += build_weekday(goals[goal_index], todo_id)
                    todo_id++;
                }
            }

            days += `
                <div class="weekDay">
                    <div class="weekDayText">${weekdays[i][j]}</div>
                    <div class="weekDayGoals" id="${weekdays[i][j]}">${goals_html}</div>
                </div>`
        }

        html += `
            <div class="weekViewColumn">
                ${days}
            </div>`
    }

    $('#content').html(html)


    dragula([document.querySelector("#Monday"), document.querySelector("#Tuesday"),
        document.querySelector("#Wednesday"), document.querySelector("#Thursday"),
        document.querySelector("#Friday"), document.querySelector("#Saturday"),
        document.querySelector("#Sunday")]).on('drag', function (event) {
        // window.goalsAPI.changeDate({})

    }).on('drop', function (event) {
        console.log($(event.parentNode).attr('id'))
        let day_id = weekdays2.indexOf($(event.parentNode).attr('id'))
        let date = l_date.weekday_sql(day_id)
        let goal_id = $(event).find('.todoId').text()

        let order = []
        let week_day = $(event.parentNode).children()
        for (let i = 0; i < week_day.length; i++) {
            console.log(week_day.eq(i).find('.todoId').text())
            order.push(Number(week_day.eq(i).find('.todoId').text()))
        }

        window.goalsAPI.changeDate({date: date, id: goal_id, order: order})
    })
})

function build_weekday(goal, todo_id) {
    let difficulty = `images/goals/rank${goal.Difficulty}.svg`
    let todo = `
        <div class="todo">
            <div class="todoId">${todo_id}</div>
            <div class="todoCheck" style="background: ${categories[goal.category][0]} url(${difficulty}) no-repeat">
                <div class="checkDot" style="background-image: ; border: 2px  ${check_border[goal.Importance]} solid"></div>
                <input type="checkbox" class="check_task">
            </div>
            <div class="taskText"><span class="task">${goal.goal}</span></div>
        </div>`

    return todo;
}



