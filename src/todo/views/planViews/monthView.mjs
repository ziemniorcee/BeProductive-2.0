export class MonthView {
    constructor(todo) {
        this.todo = todo

        this.initEventListeners()

        this.is_month_drag = 0
    }

    initEventListeners() {
        $(document).on('click', '.sidebarTask', () => {
            this.is_month_drag = 0
        })

        $(document).on('mouseup', '.monthDay', async (event) => {
            if (event.which === 1 && event.target.className === "monthGoals") {
                let day_index = Number($(event.currentTarget).find('.monthDate').text())
                this.todo.appSettings.date.set_sql_month(day_index)
                await this.todo.todoViews.planViews.dayView.display()
            }
        })


    }

    /**
     * launches month view
     */
    async display() {
        let goals = await window.goalsAPI.getMonthView({
            dates: this.todo.appSettings.date.get_sql_month(this.todo.appSettings.date.day_sql),
            goal_check: 0
        })

        $("#main").html('')
        this._month_header_HTML()
        $("#main").append(this._month_content_HTML())

        this.make_month_goals(goals)

        this.set_today()

        let rightbar = $('#rightbar')
        rightbar.html(rightbar.html())

        this.dragula_month_view()
    }

    /**
     * Builds month goals and adds them to days
     * day_shift is calculated, so it ignores invisible month days
     * @param goals_dict data of goals
     */
    make_month_goals(goals_dict) {
        let day_shift = 0
        let $month_date = $('.monthDate')

        for (let i = 0; i < $month_date.length; i++){
            if (Number($month_date.eq(i).text()) === 1) {
                day_shift = i
                break
            }
        }


        for (const [day, goals] of Object.entries(goals_dict)) {
            let goals_space = $('.monthGoals').eq(day - 1 + day_shift)
            for (let i = 0; i < goals.length; i++) {
                goals_space.append(this.build_month_goal(goals[i]))
            }
        }
    }


    /**
     * Creates body of month view
     * first are build rows then columns
     * @returns {string} HTML of month content
     */
    _month_content_HTML() {
        let month_params = this.todo.appSettings.date.get_format_month()
        let month_days_limit = month_params[1] - month_params[0]
        let month_counter = 0;

        let header = ""
        for (let i = 0; i < 7; i++) {
            header += `
            <div class="monthWeekDay">
                ${this.todo.appSettings.data.weekdays2[i]}
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
    set_today() {
        let today_day = this.todo.appSettings.date.is_today_monthview()
        if (today_day) {
            let monthDate = $('.monthDate')
            for (let i = 0; i < monthDate.length; i++) {
                if (Number(monthDate.eq(i).text()) === today_day) {
                    let id = monthDate.index(monthDate.eq(i))
                    let month_day = $('.monthDay')
                    month_day.eq(id).css("border-color", "#2979FF")
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
    _month_header_HTML() {
        let date = this.todo.appSettings.date.get_month_display_format(this.todo.appSettings.date.day_sql)
        let main_title = this.todo.appSettings.date.get_fixed_header_month()

        const header_template = $('#viewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()
        $header_clone.find('#planDateSelector .dateDeciderToday').text("This month")
        $header_clone.find('#planDateSelector .dateDeciderTomorrow').text("Next month")
        $header_clone.find('.viewOption').css('background-color', '#121212')
        $header_clone.find('#monthViewButton').css('background-color', '#2979FF')
        $header_clone.find('.viewOption2').eq(0).attr('src', 'images/goals/monthview.png')

        $header_clone.find('#mainTitle').text(main_title)
        $header_clone.find('#date').text(date)
        $('#main').append($header_clone)
        $('.viewOption2 img').eq(0).attr('src', 'images/goals/monthview.png')

        $( () => {
            $("#planDatePicker").datepicker({
                dateFormat: "dd.mm.yy",

                onSelect: async (dateText, inst) => {
                    const $input = inst.input;
                    const selectedDate = $input.datepicker('getDate');
                    this.todo.appSettings.date.set_attributes(selectedDate)
                    await this.display()

                    $('#selectDate').text(selectedDate)
                    $('#planDateSelector').css('display', 'none')
                }
            });
        });
    }


    /**
     * build month goal from given data
     * @param goals_dict data of goals
     * @returns {string}
     */
    build_month_goal(goal) {
        let converted_text = this.todo.appSettings.data.decode_text(goal['goal'])
        let category_color = "rgb(74, 74, 74)"
        let date_label = ""
        let deadline_label = ""

        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
        }

        if(goal.date_type === 0){
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        }
        else if(goal.date_type === 1){
            deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
        }

        return `
        <div class="monthTodo" style="">
            <div class="monthTodoId">${goal["id"]}</div>
            <div class="monthTodoLabel" style="background-color: ${category_color}"></div>
            <div class="monthTodoText" >
                <div class="monthTodoTextLimit">
                    ${converted_text}
                </div>
            </div>
            <div class="monthTodoDateLabel">
                ${deadline_label}
                ${date_label}
            </div>
        </div>`
    }


    /**
     * allows drag&drop for month view
     */
    dragula_month_view() {
        this.is_month_drag = 0
        let dragula_array
        let dragged_task

        let is_project_sidebar = $('#sideProjectHeader').length
        if (is_project_sidebar) {
            dragula_array = Array.from($('#sideProjectGoals')).concat(Array.from($('.monthGoals')))
        } else {
            dragula_array = Array.from($('.historyTasks')).concat(Array.from($('.monthGoals')))
        }

        dragula(dragula_array, {
            copy: (el) => {
                return !el.parentNode.className.includes("monthGoals");
            },
            accepts: (el, target) => {
                this.is_month_drag = 0
                return target.className.includes("monthGoals");
            },
            moves: (el) => {
                let is_in = $(el).find('.alreadyEmblem').length
                let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'
                if (this.is_month_drag === 0 && is_in === 0 && !is_done) {
                    this.is_month_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            dragged_task = $(event)
            this.is_month_drag = 0
        }).on('drop', (event) => {
            let todos = $('#main .monthTodo')
            let new_goal_pos = todos.index($(event))

            if (event.className.includes("monthTodo")) {
                this._change_order(event)
            } else if (event.className.includes("todo") && $('#main .todo').length) {
                this._get_from_project(event, new_goal_pos, dragged_task)
            } else if (event.parentNode !== null) {
                this._get_from_sidebar(event, dragged_task)
            }
        })
    }

    /**
     * Fixes order based on goals positions
     * @param event dropped goal
     */
    _change_order(event) {
        let goal_id = $(event).find('.monthTodoId').text()
        let day = Number($(event).closest('.monthDay').find('.monthDate').text())
        let date = this.todo.appSettings.date.get_sql_month_day(day)
        let day_goals = $(event).parent().children()

        let order = []
        for (let i = 0; i < day_goals.length; i++) {
            order.push(Number(day_goals.eq(i).find('.monthTodoId').text()))
        }

        window.goalsAPI.changeDate({date: date, id: goal_id, order: order})
    }

    _get_from_project(event, new_goal_pos, dragged_task) {
        let sidebar_pos = $('#rightbar .todo').index(dragged_task)
        let new_goal_index = 0
        let selected_month_day = 0
        let item_found = false
        let month_day_position = 0
        let item_day_before = null
        let jq_monthGoals = $('.monthGoals')

        for (let i = 0; i < jq_monthGoals.length; i++) {
            month_day_position = 0
            let todos = jq_monthGoals.eq(i).children()
            for (let j = 0; j < todos.length; j++) {
                if (todos.eq(j).attr('class').includes("todo")) {
                    item_found = true
                    break
                } else {
                    new_goal_index++
                    month_day_position += 1
                }
            }
            if (item_found) {
                selected_month_day = i
                if (month_day_position !== 0) item_day_before = todos.eq(month_day_position)
                break
            }
        }

        $(dragged_task).remove()

        let category_id = this.todo.appSettings.data.getIdByColor(this.todo.appSettings.data.categories.categories, $(event).find('.todoCheck').css('background-color'))
        let goal_dict = {
            goal: $(event).find('.task').text(),
            category: category_id,
        }
        if (item_day_before === null) {
            jq_monthGoals.eq(selected_month_day).append(this.build_month_goal(goal_dict))
        } else {
            $(item_day_before).after(this.build_month_goal(goal_dict))
        }

        let day = Number($(event).closest('.monthDay').find('.monthDate').text())
        let add_date = this.todo.appSettings.date.sql_sql_month_day(day)

        window.projectsAPI.getFromProject({
            date: add_date,
            sidebar_pos: sidebar_pos,
            main_pos: new_goal_index,
            to_delete: true
        })

        $(event).remove()
    }

    _get_from_sidebar(event, drag_sidebar_task) {
        let new_goal_pos = -1;
        let todos = $(event).closest('.monthGoals').children()
        for (let i = 0; i < todos.length; i++) if (todos[i].className !== "monthTodo") new_goal_pos = i

        let month_day = Number($('.monthGoals .sidebarTask').closest('.monthDay').find('.monthDate').text())
        let date = this.todo.appSettings.date.get_sql_month_day(month_day)

        window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(drag_sidebar_task), date: date})
        if (drag_sidebar_task.closest('.historyTasks').children().length > 1) drag_sidebar_task.closest('.sidebarTask').remove()
        else drag_sidebar_task.closest('.day').remove()
    }
}
