import {l_date} from "./date.js";
import {categories, check_border, weekdays2, weekdays_grid} from "./data.mjs";
import { build_view, day_view, set_todo_dragged} from "./render.mjs";
import {close_edit, set_goal_pos} from "./edit.mjs";
import {already_emblem_HTML, reset_project_pos} from "./project.mjs";


$(document).on('click', '#dashWeek', function () {
    console.log()
    if ($('#projectContent').length) reset_project_pos()

    $('#mainTitle').text('This week')
    $('.dashViewOption').css('backgroundColor', '#55423B')
    $(this).css('backgroundColor', '#FF5D00')
    l_date.fix_header_week()
    build_view(_week_view_main(), _week_view_header())

    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
    window.sidebarAPI.askHistory({date: l_date.week_current[0]})
});



(function () {
    let mousedown_weekday = false

    $(document).on('mousedown', '.weekDay', function (event) {
        if (event.which === 1 && event.target.className.includes("weekDayGoals")) {
            mousedown_weekday = true
        }
    })

    $(document).on('mouseup', '.weekDay', function (event) {
        if (event.which === 1 && event.target.className.includes("weekDayGoals") && mousedown_weekday) {
            let day_index = weekdays2.indexOf($(this).find('.weekDayText').text())
            l_date.get_week_day(day_index)
            day_view()
            $('.dashViewOption').css('backgroundColor', '#55423B')
            $('#dashDay').css('backgroundColor', '#FF5D00')
            l_date.fix_header_day()

            mousedown_weekday = false
        }
    })
})();


function _week_view_main(){
    return `
    <div id="content">
        
    </div>
    `
}

function _week_view_header(){
    window.goalsAPI.askProjectsInfo()


    let date_display = l_date.get_week_display_format(l_date.week_now)
    return `
        <div id="header">
            <div id="mainTitle">This Week</div>
    
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
                    ${date_display}
                </span>
            </div>
        </div>
    `
}

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
    let date_display = l_date.get_week_display_format(l_date.week_now)
    l_date.fix_header_week()
    $('#date').text(date_display)
})

let block_prev_drag = 0

$(document).on('click', '.sidebarTask', function () {
    block_prev_drag = 0
})

export function dragula_week_view() {
    block_prev_drag = 0
    let drag_sidebar_task
    let dragula_array
    let rightbar = $('#rightbar')
    let is_project_sidebar = $('#sideProjectHeader').length
    let is_edit = $('#editTodo').css('display') === "none"
    console.log(is_edit)
    let dragged_task

    if (!is_edit){
        rightbar.html(rightbar.html())
        console.log('CHUJ')
        if (is_project_sidebar) {
            dragula_array =  Array.from($('#sideProjectGoals')).concat(Array.from($('.weekDayGoals')))
        } else {
            dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.weekDayGoals')))
        }
    }


    dragula(dragula_array, {
        copy: function (el) {
            return !el.parentNode.className.includes("weekDayGoals") ;
        },
        accepts: function (el, target) {
            block_prev_drag = 0
            return target.className.includes("weekDayGoals");
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

        dragged_task = event
    }).on('drop', function (event) {
        let new_goal_pos = $('.todo').index($(event))
        set_goal_pos(new_goal_pos)

        console.log(event)
        if (event.className.includes("todo")) {
            if(dragged_task.parentNode.id === "sideProjectGoals"){
                console.log("XPP")

                let sidebar_pos = $('#rightbar .todo').index(dragged_task)
                let new_goal_index = $('.weekDayGoals .todo').index(event)

                let display_week_day = $('.weekDayGoals').index(event.parentNode)
                let real_week_day = weekdays2.indexOf($('.weekDayText').eq(display_week_day).text())
                let add_date = l_date.week_now[real_week_day]
                window.goalsAPI.getFromProject({date: add_date, sidebar_pos: sidebar_pos, main_pos:new_goal_index})
                if ($('.sideProjectOption').eq(2).css('background-color') === 'rgb(0, 34, 68)') $(drag_sidebar_task).remove()
                else{
                    $(dragged_task).append(already_emblem_HTML())
                }
            }
            else {
                _change_order(event)
            }
        }
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
        if (l_date.week_now !== l_date.week_current) window.sidebarAPI.askHistory({date: l_date.week_current[0]})
    }, 1000);
});


export function build_week_goal(goal, todo_id) {
    let difficulty = `images/goals/rank${goal.difficulty}.svg`
    let check_state = ""
    let check_bg = ""

    if (goal.check_state) {
        check_state = "checked"
        check_bg = "url('images/goals/check.png')"
    }

    let converted_text = goal.goal.replace(/`@`/g, "'").replace(/`@@`/g, '"')

    let repeat = ""
    if (goal.knot_id) {
        repeat = `<div class="repeatLabelShow"><img class="repeatLabelImg" src="images/goals/repeat.png" alt=""></div>`
    }

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



