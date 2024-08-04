import {l_date} from "./date.js";
import {weekdays2, categories, categories2, decode_text} from "./data.mjs";
import {_repeat_label_HTML, build_view, day_view, set_todo_dragged} from "./render.mjs";
import {close_edit, set_goal_pos} from "./edit.mjs";

let block_prev_drag = 0
let mousedown_month = false

$(document).on('click', '#dashMonth', function () {
    month_view()
})

/**
 * launches month view
 */
export function month_view() {
    build_view(_month_content_HTML(), _month_header_HTML())
    set_today()
    window.goalsAPI.askMonthGoals({dates: l_date.get_sql_month()})

    dragula_month_view()
    close_edit()
}

window.goalsAPI.getMonthGoals((goals_dict) => {
    get_month_goals(goals_dict)
})

/**
 * Builds month goals and adds them to days
 * day_shift is calculated, so it ignores invisible month days
 * @param goals_dict data of goals
 */
function get_month_goals(goals_dict) {
    let day_shift = 0
    $('.monthDate').each(function () {
        if (Number($(this).text()) === 1) {
            day_shift = $('.monthDate').index(this)
            return false;
        }
    });

    for (const [day, goals] of Object.entries(goals_dict)) {
        let goals_space = $('.monthGoals').eq(day - 1 + day_shift)
        for (let i = 0; i < goals.length; i++) {
            goals_space.append(build_month_goal(goals[i]))
        }
    }
}

/**
 * Creates body of month view
 * first are build rows then columns
 * @returns {string} HTML of month content
 */
function _month_content_HTML() {
    let month_params = l_date.get_format_month()
    let month_days_limit = month_params[1] - month_params[0]
    let month_counter = 0;

    let header = ""
    for (let i = 0; i < 7; i++) {
        header += `
            <div class="monthWeekDay">
                ${weekdays2[i]}
            </div>`
    }

    let grid = ""
    let weeks_end_flag = true

    for (let i = 0; i < 6 && weeks_end_flag; i++) {
        let week = ""

        for (let j = 0; j < 7; j++) {
            let display = "hidden"
            if (month_counter >= month_params[0] && month_counter < month_params[1]) display = "visible"
            let day = month_counter - month_params[0] + 1


            week += `
                <div class="monthDay" style="visibility: ${display}">
                    <div class="monthDate">${day < 10 ? "0" + day : day}</div>
                    <div class="monthGoals">
                    </div>
                </div>`

            month_counter++

            if (day >= month_days_limit) weeks_end_flag = false
        }

        grid += `
            <div class="monthWeek">
                ${week}
            </div>`

        if (i === 5) { // if six weeks
            $('.monthGoals').css('max-height', "9.0vh")
        }
    }

    return `
        <div id="content">
            <div id="monthHeader">
            ${header}
        </div>
        <div id="monthGrid">
            ${grid}
        </div>
        </div>`
}

/**
 * checks if today is in current month
 * if it does, day is marked
 */
function set_today() {
    let today_day = l_date.is_today_monthview()
    if (today_day) {
        let monthDate = $('.monthDate')
        for (let i = 0; i < monthDate.length; i++) {
            if (Number(monthDate.eq(i).text()) === today_day) {
                let id = monthDate.index(monthDate.eq(i))
                let month_day = $('.monthDay')
                month_day.eq(id).css("border-color", "#FFC90E")
                month_day.eq(id).append("<div id='todayMonthText'>Today</div>")
                break
            }
        }
    }
}

/**
 * creates head of month view
 * @returns {string} HTML of month header
 */
function _month_header_HTML() {
    window.goalsAPI.askProjectsInfo()

    let date = l_date.get_month_display_format(l_date.day_sql)
    let main_title = l_date.get_fixed_header_month()
    return `
        <div id="header">
            <div id="mainTitle">${main_title}</div>
    
            <div id="projectShowed">
                <img src="images/goals/projects/project.png" alt="">
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
        </div>`
}


/**
 * build month goal from given data
 * @param goals_dict data of goals
 * @returns {string}
 */
export function build_month_goal(goals_dict) {
    let converted_text = decode_text(goals_dict['goal'])
    let repeat = goals_dict.knot_id ? _repeat_label_HTML() : "";
    let goal_id = $('#main, .monthTodo').length - 1

    return `
        <div class="monthTodo" style="background-color: ${categories2[goals_dict['category']]}">
            <div class="monthTodoId">${goal_id}</div>
            <div class="monthTodoLabel" style="background-color: ${categories[goals_dict['category']][0]}"></div>
            <div class="monthTodoText" >${converted_text} ${repeat}</div>
        </div>`
}


/**
 * allows drag&drop for month view
 */
export function dragula_month_view() {
    block_prev_drag = 0
    let drag_sidebar_task
    let dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.monthGoals')))

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
        let new_goal_id = $('.monthTodo').index($(event))
        set_goal_pos(new_goal_id)

        drag_sidebar_task = $(event)
        set_todo_dragged(true)
        block_prev_drag = 0

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


$(document).on('mousedown', '.monthDay', function (event) {
    if (event.which === 1 && event.target.className === "monthGoals") {
        mousedown_month = true
    }
})

$(document).on('mouseup', '.monthDay', function (event) {
    open_day_from_month(event, this)
})

/**
 * opens day from month view
 * @param event mouse press
 * @param that selected day
 */
function open_day_from_month(event, that){
    if (event.which === 1 && event.target.className === "monthGoals" && mousedown_month) {
        let day_index = Number($(that).find('.monthDate').text())
        l_date.set_sql_month(day_index)
        day_view()

        $('.dashViewOption').css('backgroundColor', '#55423B')
        $('#dashDay').css('backgroundColor', '#FF5D00')
        l_date.get_day_view_header()

        mousedown_month = false
    }
}

export function set_block_prev_drag_month(option) {
    block_prev_drag = option
}

$(document).on('click', '.sidebarTask', function () {
    block_prev_drag = 0
})