export class WeekView {
    constructor(todo) {
        this.todo = todo
        this.is_week_drag = 0
        this.initEventListeners()

    }

    initEventListeners() {
        $(document).on('click', '.weekDayGoals .check_task', (event) => {
            event.stopPropagation()
            this.check_week_goal(event.currentTarget)
        });

        $(document).on('click', '.sidebarTask', () => {
            this.is_week_drag = 0
        })

        $(document).on('mouseup', '.weekDay', async (event) => {
            if (event.which === 1 && event.target.className.includes("weekDayGoals")) {
                let day_index = this.todo.appSettings.data.weekdays2.indexOf($(event.currentTarget).find('.weekDayText').text())
                this.todo.appSettings.date.get_week_day(day_index)
                await this.todo.todoViews.planViews.dayView.display()
            }
        })
    }

    /**
     * Displays week view in #main
     * builds view, gets goals, allows drag&drop and closes edit
     */
    async display() {
        let goals = await window.goalsAPI.getWeekView({dates: this.todo.appSettings.date.week_now})

        $('#main').html('')
        this._week_header_HTML()
        $('#main').append(this._week_content_HTML())
        this.get_week_goals(goals)



        let rightbar = $('#rightbar')
        rightbar.html(rightbar.html())

        this.dragula_week_view()

        $('#content').css('flex-direction', 'row')
    }

    /**
     * iterates through weekdays and given goals data.
     * adds goal if current date is correct, and it removes first element
     * @param goals data of goals in week
     */
    get_week_goals(goals) {
        for (let i = 0; i < 7; i++) {
            let is_current_day = true
            while (is_current_day && goals.length) {
                if (goals[0].addDate === this.todo.appSettings.date.week_now[i]) {
                    let week_day = $(`#${this.todo.appSettings.data.weekdays2[i]}`)
                    week_day.append(this.build_week_goal(goals[0]))
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
    build_week_goal(goal) {
        let check_state = goal.check_state ? "checked" : ""
        let check_bg = goal.check_state ? "url('images/goals/check.png')" : ""
        let converted_text = this.todo.appSettings.data.decode_text(goal.goal)

        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        let date_label = ""
        let deadline_label = ""

        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
            category_border = `border-right: 4px solid ${category_color}`
        }
        console.log(goal.date_type)

        if(goal.date_type === 0){
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        }
        else if(goal.date_type === 1){
            deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
        }

        let check_color = this.todo.appSettings.data.check_border[goal.importance]

        return `
        <div class="todo"  style="${category_border}">
            <div class="todoId">${goal.id}</div>
            <div class="todoCheck">
                <input type='checkbox' class='check_task' ${check_state} style="border-color:${check_color}; color:${check_color}">
            </div>
            <div class="taskText">
                <span class="task">
                    ${converted_text}
                    ${deadline_label} 
                    ${date_label}
                 </span>
            </div>
        </div>`;
    }


    /**
     * creates body of week view
     * it starts with columns, monday is bigger
     * @returns {string} HTML of content
     */
    _week_content_HTML() {
        let today_sql = this.todo.appSettings.date.sql_format(this.todo.appSettings.date.today)

        let week_columns = ""
        for (let i = 0; i < 4; i++) {
            let days = ""
            for (let j = 0; j < this.todo.appSettings.data.weekdays_grid[i].length; j++) {
                let sql_date = this.todo.appSettings.date.week_now[i + j * 3]

                let classes = "weekDayGoals"
                let today_label = ""
                if (sql_date === today_sql) {
                    classes = "weekDayGoals weekToday"
                    today_label = "<div id='todayWeekText'>Today</div>"
                }
                days += `
                <div class="weekDay">
                    ${today_label}
                    <div class="weekDayText">${this.todo.appSettings.data.weekdays_grid[i][j]}</div>
                    <div class="${classes}" id="${this.todo.appSettings.data.weekdays_grid[i][j]}"></div>
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
    _week_header_HTML() {
        let header_params = this.todo.appSettings.date.get_header_week()

        const header_template = $('#viewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()
        $header_clone.find('#planDateSelector .dateDeciderToday').text("This week")
        $header_clone.find('#planDateSelector .dateDeciderTomorrow').text("Next week")
        $header_clone.find('.viewOption').css('background-color', '#121212')
        $header_clone.find('#weekViewButton').css('background-color', '#2979FF')
        $header_clone.find('.viewOption2 img').eq(0).attr('src', 'images/goals/weekview.png')

        $header_clone.find('#mainTitle').text(header_params[0])
        $header_clone.find('#date').text(header_params[1])
        $('#main').append($header_clone)

        $( () => {
            $("#planDatePicker").datepicker({
                dateFormat: "dd.mm.yy",

                onSelect: async (dateText, inst) => {
                    const $input = inst.input;
                    const selectedDate = $input.datepicker('getDate');
                    this.todo.appSettings.date.set_attributes(selectedDate)
                    await this.display()
                    let header_params = this.todo.appSettings.date.get_header_week()
                    $('#mainTitle').text(header_params[0])
                    $('#date').text(header_params[1])

                    $('#selectDate').text(selectedDate)
                    $('#planDateSelector').css('display', 'none')
                }
            });
        });
    }


    /**
     * Allows drag & drop in week view
     * dragula array based on opened sidebar
     * drop functions are based on drop location
     * and differences between state before and after
     */
    dragula_week_view() {
        this.is_week_drag = 0
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
            copy: (el) => {
                return !el.parentNode.className.includes("weekDayGoals");
            },
            accepts: (el, target) => {
                this.is_week_drag = 0
                return target.className.includes("weekDayGoals");
            },
            moves: (el) => {
                let is_in = $(el).find('.alreadyEmblem').length
                let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'
                if (this.is_week_drag === 0 && is_in === 0 && !is_done) {
                    this.is_week_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            drag_sidebar_task = $(event)
            this.is_week_drag = 0

            goals_length_before = $('#main .todo').length
        }).on('drop', (event) => {
            let todos = $('#main .todo')
            let goals_length_after = todos.length
            let new_goal_pos = todos.index($(event))


            if (event.className.includes("todo")) {
                if (goals_length_before !== goals_length_after) {
                    this._get_from_project(event, new_goal_pos, drag_sidebar_task)
                } else if (drag_sidebar_task.parent().attr('id') !== "sideProjectGoals") {
                    this._change_order(event)
                }
            } else if (event.parentNode !== null) this._get_from_sidebar(event, drag_sidebar_task)

        })
    }

    /**
     * imports goal from project sidebar
     * @param event event of dropped task
     * @param new_goal_pos new position of dropped task
     * @param dragged_task drag event of the task
     */
    _get_from_project(event, new_goal_pos, dragged_task) {
        let sidebar_pos = $('#rightbar .todo').index(dragged_task)
        let new_goal_index = $('.weekDayGoals .todo').index(event)

        let display_week_day = $('.weekDayGoals').index(event.parentNode)
        let real_week_day = this.todo.appSettings.data.weekdays2.indexOf($('.weekDayText').eq(display_week_day).text())
        let add_date = this.todo.appSettings.date.week_now[real_week_day]

        window.projectsAPI.getFromProject({
            date: add_date,
            sidebar_pos: sidebar_pos,
            main_pos: new_goal_index,
            to_delete: true
        })
        $(dragged_task).remove()
        $('#main .todoId').eq(new_goal_pos).text($('#main .todo').length - 1)
    }


    /**
     * Fixes order based on goals positions
     * @param event drop state of goals
     */
    _change_order(event) {
        let day_id = this.todo.appSettings.data.weekdays2.indexOf($(event.parentNode).attr('id'))
        let date = this.todo.appSettings.date.week_now[day_id]
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
    _get_from_sidebar(event, drag_sidebar_task) {
        let new_goal_pos = -1;
        let todos = $(event).closest('.weekDayGoals').children()

        for (let i = 0; i < todos.length; i++) {
            if (todos[i].className !== "todo") new_goal_pos = i
        }

        let week_day = $('.weekDayGoals .sidebarTask').closest('.weekDayGoals').attr("id")
        let date = this.todo.appSettings.date.week_current[this.todo.appSettings.data.weekdays2.indexOf(week_day)]

        window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: date})

        if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
        else drag_sidebar_task.closest('.day').remove()
    }


    /**
     * Changes check on week goals and fixes goals ids
     * @param that selected check in week view
     */
    check_week_goal(that) {
        $(that).prop('disabled', true)
        const goal_ids = Number($(that).closest('.todo').find('.todoId').text())
        const rel_id = $('.check_task').index(that)
        $('.checkDot').eq(rel_id).css('background-image', "url('images/goals/check.png')")

        setTimeout(() => {
            console.log('CHUJ')
            let todos = $('#main .todo')
            todos.eq(rel_id).remove()
            window.goalsAPI.changeWeekGoalCheck({id: goal_ids, state: 1})
            this.dragula_week_view()
            let new_ids = $(`#main .todoId`)
            for (let i = 0; i < new_ids.length; i++) {
                new_ids.eq(i).text(i)
            }

            if (this.todo.appSettings.date.week_now !== this.todo.appSettings.date.week_current) window.sidebarAPI.askHistory({date: this.todo.appSettings.date.week_current[0]})
        }, 1000);

    }
}




