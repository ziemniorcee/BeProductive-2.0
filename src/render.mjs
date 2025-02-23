import {
    check_border,
    decode_text,
    encode_text,
    getIdByColor,
    hsvToRgb,
    weekdays2,
    projects,
    project_conn
} from "./data.mjs";
import {create_today_graphs} from './graph.mjs';


export class DayView {
    constructor(app_data, app_date, app_categories, app_steps) {
        this.initEventListeners()


        this.data = app_data
        this.date = app_date
        this.categories = app_categories
        this.steps = app_steps

        this.todo_to_remove = null
        this.is_day_drag = 0
    }


    initEventListeners() {


        $(document).on('drop', '.todo', () => {
            dragged_task.css('background-color', "#FFFFFF")
        })

        $(document).on('click', '#todosAll .check_task', (event) => {
            event.stopPropagation()
            let position = $('.check_task').index(event.currentTarget)
            this.change_main_check(position)
        });

        /**
         * opens context menu for goals goal and saves selected goal
         */
        $(document).on('contextmenu', '#todosAll .todo, .monthTodo', (event) => {
            if ($(event.currentTarget).find('.repeatLabelShow').length) window.appAPI.contextMenuOpen({repeat: 1})
            else window.appAPI.contextMenuOpen({repeat: 0, option: 0})
            this.todo_to_remove = event.target
        })

        /**
         * opens context menu for sidebar goal and saves selected sidebar goal
         */
        $(document).on('contextmenu', '.sidebarTask', (event) => {
            if ($(event.currentTarget).parents('.historyTasks').length) window.appAPI.contextMenuOpen({
                repeat: 0,
                option: 1
            })
            else window.appAPI.contextMenuOpen({repeat: 0, option: 2})
            this.todo_to_remove = event.target
        })

        /**
         * opens context menu for sidebar project goal and saves selected sidebar project goal
         */
        $(document).on('contextmenu', '#sideProjectGoals .todo', (event) => {
            window.appAPI.contextMenuOpen({repeat: 0, option: 3})
            this.todo_to_remove = event.target
        })

        $(document).on('click', '#testPanelClear', () => {
            this.remove_goal()
        })

        /**
         * removes goal after context menu click
         */
        window.goalsAPI.removingGoal(() => {
            this.remove_goal()
        })

        /**
         * removes goal and asks to remove the repeat goals after context menu click
         */
        window.goalsAPI.removingFollowing(() => {
            let id = $(this.todo_to_remove).find('.todoId').text()
            let date = this.date.day_sql
            if ($('#monthGrid').length) {
                id = $(this.todo_to_remove).find('.monthTodoId').text()
                let day = Number($(this.todo_to_remove).closest('.monthDay').find('.monthDate').text()) //returns wrong day
                date = this.date.get_sql_month_day(day)
            } else if ($('.weekDay').length) {
                let day = $(this.todo_to_remove).closest('.weekDay').find('.weekDayText').text()
                let index = weekdays2.indexOf(day)
                date = this.date.week_current[index]
            }

            window.goalsAPI.followingRemoved({id: id, date: date})

            this.todo_to_remove.remove()

        })

        /**
         * removes repeating goals and fixes ids
         */
        window.goalsAPI.getFollowingRemoved((positions) => {
            let month_grid = $('#monthGrid')
            let elements_ids = month_grid.length ? $('.monthTodoId') : $('.todoId')
            let todo_type = month_grid.length ? '.monthTodo' : '.todo'

            for (let i = 0; i < elements_ids.length; i++) {
                let current_id = Number(elements_ids.eq(i).text())
                if (!positions.includes(current_id)) {
                    let shift = this.get_shift(current_id, positions)
                    elements_ids.eq(i).text(current_id - shift)
                } else {
                    elements_ids.eq(i).closest(todo_type).remove()
                }
            }
        })

        $(document).on('click', '#testPanelRemoveHistory', () => {
            this.remove_history()
        })

        window.sidebarAPI.removingHistory(() => {
            this.remove_history()
        })

        $(document).on('click', '#testPanelRemoveIdea', () => {
            this.remove_idea()
        })

        window.sidebarAPI.removingIdea(() => {
            this.remove_idea()
        })

        /**
         * removes project goal
         */
        window.sidebarAPI.removingProjectGoal(() => {
            window.sidebarAPI.projectGoalRemoved({id: $('#sideProjectGoals .todo').index(this.todo_to_remove)})
            this.todo_to_remove.remove()
        })

        $(document).on('click', '.sidebarTask', function () {
            this.is_day_drag = 0
        })
    }

    /**
     * Displays day view in #main
     * builds view, gets goals, allows drag&drop and closes edit
     */
    async display() {
        let goals = await window.goalsAPI.getDayView({date: this.date.day_sql})
        this.set_day_html()
        this.set_goals(goals)


        let rightbar = $('#rightbar')
        rightbar.html(rightbar.html())

        if ($('#days').length && $('#head_text') === "History") {
            window.sidebarAPI.askHistory({date: this.date.get_history_day()})
        } else if (!$('#sideProjectGoals').length) {
            this.dragula_day_view()
        }

    }

    dragula_resetter() {
        const targetNode = document.getElementById('todosAll');
        const allowedSelectors = ['div.steps', 'div#todosFinished, div.step'];

        const callback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (allowedSelectors.some(selector => mutation.target.matches(selector))) {
                    this.dragula_day_view()
                }
            }

        };

        const observerConfig = {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        };

        const observer = new MutationObserver(callback);

        observer.observe(targetNode, observerConfig);
    }

    set_day_html() {
        let main_title = this.date.get_day_view_header()
        let date = this.date.get_display_format(this.date.day_sql)

        const header_template = $('#viewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()

        $header_clone.find('#mainTitle').text(main_title)
        $header_clone.find('#date').text(date)

        $header_clone.find('.viewOption').css('background-color', '#121212')
        $header_clone.find('#dayViewButton').css('background-color', '#2979FF')
        $header_clone.find('.viewOption2 img').eq(0).attr('src', 'images/goals/dayview.png')

        let categories_html = this.categories._categories_HTML()

        const content_template = $('#dayViewContentTemplate').prop('content');
        let $content_clone = $(content_template).clone()


        const input_template = $('#todoInputTemplate').prop('content');
        let $input_clone = $(input_template).clone()
        $input_clone.find('#categoryPicker1').html(categories_html)

        $('#main').html($header_clone)
        $('#main').append($content_clone)
        $('#content').append($input_clone)
    }

    /**
     * Gets goals from ipcHandlers
     * 1st it iterates thorough goals and appends them to proper to do section
     * 2nd it
     * @param goals data of goals
     */
    set_goals(goals) {
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = decode_text(goals[i]['goal'])

            let todo_area = goals[i]['check_state'] ? "#todosFinished" : "#todosArea";
            $(todo_area).append(this.build_goal(goals[i]))
        }

        this.build_finished_count()
    }

    /**
     * builds goal from given data and returns HTML
     * @param goal dict of goal's data
     * @returns {string} HTML of built goal
     */
    build_goal(goal) {
        let todo_id = $('#todosAll .todo').length
        let category_color = ""
        if (goal.category !== 0) category_color = this.data.categories[goal.category][0]
        let check_state = goal.check_state ? "checked" : "";
        let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
        let url = `images/goals/rank${goal.difficulty}.svg`
        let repeat = goal.knot_id ? this.data._repeat_label_HTML() : "";
        let project_emblem = this.data.project_emblem_html(goal.pr_pos)

        return `
        <div class='todo'>
            <div class="todoId">${todo_id}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px solid ${check_border[goal.importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='taskText'>
                <span class='task'> ${goal.goal} </span>
                ${repeat}
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
    }

    /**
     * Counts goals finished goals
     * if there are finished goals it adds button for finished goals
     */
    build_finished_count() {
        let finished_count = $('#todosFinished .todo').length
        $('#finishedButton').css('display', finished_count ? "block" : "none")
        $("#finishedCount").html(finished_count);
    }

    /**
     * Sets drag and drop for day view
     * if edit in not on rightbar resets
     * depends if project sidebar is on, dragula elements are selected
     */
    dragula_day_view() {
        this.is_day_drag = 0
        let dragged_task
        let dragula_array
        let todos_area_before

        let is_project_sidebar = $('#sideProjectHeader').length

        if (is_project_sidebar) {
            dragula_array = Array.from($('#sideProjectGoals')).concat([document.querySelector("#todosArea")])
        } else {
            dragula_array = Array.from($('.historyTasks')).concat([document.querySelector("#todosArea")])
        }
        dragula(dragula_array, {
            copy: (el) => {
                return el.parentNode.id !== "todosArea";
            },
            accepts: (el, target) => {
                this.is_day_drag = 0
                return target.parentNode.id === "todosAll";
            },
            moves: (el) => {

                let is_in = $(el).find('.alreadyEmblem').length
                let is_done = $('.sideProjectOption').eq(0).css('background-color') === 'rgb(0, 34, 68)'
                if (this.is_day_drag === 0 && is_in === 0 && !is_done) {
                    this.is_day_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            dragged_task = $(event)
            dragged_task.css('background-color', "#141414")

            this.is_day_drag = 0
            todos_area_before = Array.from($('#todosArea').children())
        }).on('drop', (event) => {
            dragged_task.css('background-color', "rgba(255, 255, 255, 0.05)")

            let new_goal_pos = $('.todo').index($(event))
            let todos_area_after = Array.from($('#todosArea').children())

            if (todos_area_after.length !== todos_area_before.length) {
                if (dragged_task.attr('class') === "sidebarTask") this._get_from_history(dragged_task)
                else if (dragged_task.parent().attr('id') === "sideProjectGoals") {
                    this._get_from_project(new_goal_pos, dragged_task)
                }
            } else {
                this.change_order()
            }

        }).on('cancel', function () {
            dragged_task.css('background-color', "rgba(255, 255, 255, 0.05)")
        });
    }

    /**
     * Gets goal from history by drag
     * @param dragged_task dragged history task
     */
    _get_from_history(dragged_task) {
        window.sidebarAPI.deleteHistory({id: $('#rightbar .sidebarTask').index(dragged_task), date: this.date.day_sql})

        if (dragged_task.closest('.historyTasks').children().length > 1) dragged_task.closest('.sidebarTask').remove()
        else dragged_task.closest('.day').remove()
    }

    /**
     * gets goal from project sidebar by drag
     * @param new_goal_index new position of goal
     * @param dragged_task selected goal
     */
    _get_from_project(new_goal_index, dragged_task) {
        let todos = $('#main .todo')
        let sidebar_pos = $('#rightbar .todo').index(dragged_task)

        $('.todoId').eq(new_goal_index).text(todos.length - 1)
        let project_pos = $('#sideProjectId').text()
        todos.eq(new_goal_index).append(this.data.project_emblem_html(project_pos))
        window.projectsAPI.getFromProject({date: this.date.day_sql, sidebar_pos: sidebar_pos, main_pos: new_goal_index})

        $(dragged_task).remove()

        let $sidebar_todoId = $('#rightbar .todoId')
        for (let i = 0; i < $sidebar_todoId.length; i++) {
            $sidebar_todoId.eq(i).text(i)
        }
    }

    /**
     * fixes order of goals and saves it
     */
    change_order() {
        let goals = $('#main .todoId')
        if ($('#monthGrid').length) goals = $('#main .monthTodoId')
        let order = []
        for (let i = 0; i < goals.length; i++) order.push(goals.eq(i).text())

        window.goalsAPI.rowsChange({after: order})
    }


    remove_goal() {
        let id = $(this.todo_to_remove).find('.todoId').text()
        if ($('#monthGrid').length) id = $(this.todo_to_remove).find('.monthTodoId').text()

        window.goalsAPI.goalRemoved({id: id, date: this.date.day_sql})
        if ($('#todosAll').length) {
            if ($(this.todo_to_remove).find('.check_task').prop('checked')) {
                let finished_count = $('#todosFinished .todo').length
                if (finished_count === 1) $('#finishedButton').css('display', 'none')
                $('#finishedCount').html(finished_count - 1)
            }
        }
        this.todo_to_remove.remove()

        let goals = $('.todoId')
        for (let i = 0; i < goals.length; i++) {
            if (goals.eq(i).html() > id) goals.eq(i).html(goals.eq(i).html() - 1)
        }
    }

    /**
     * finds how many positions are lesser than selected position
     * @param value checked goal
     * @param array positions of goals to delete
     * @returns position of sorte
     */
    get_shift(value, array) {
        let new_arr = array.slice()
        new_arr.push(value)
        new_arr.sort((a, b) => a - b)
        return new_arr.indexOf(value)
    }

    /**
     * removes history goal
     */
    remove_history() {
        window.sidebarAPI.historyRemoved({id: $('.sidebarTask').index(this.todo_to_remove)})
        if ($(this.todo_to_remove).closest('.historyTasks').children().length === 1) {
            this.todo_to_remove = $(this.todo_to_remove).closest('.day')
        }
        this.todo_to_remove.remove()
    }

    /**
     * removes idea goal
     */
    remove_idea() {
        window.sidebarAPI.ideaRemoved({id: $('.sidebarTask').index(this.todo_to_remove)})
        this.todo_to_remove.remove()
    }

    /**
     * changes check of goals
     * @param position selected goal position
     */
    change_main_check(position) {
        const check_task = $('.check_task').eq(position)
        const dot = $('.checkDot').eq(position)
        let todo = $('.todo').eq(position)
        let goal_id = $('.todoId')

        if ($('#monthGrid').length) {
            goal_id = $('.monthTodoId')
            todo = $('.monthTodo')
        }

        let state = Number(check_task.prop('checked'))

        let category_color = $(dot).css('borderColor')
        $(dot).replaceWith(`<div class="checkDot" style="background-image: ${state ? "url('images/goals/check.png')" : ""}; border-color:${category_color}">`)
        check_task.replaceWith(`<input type='checkbox' ${state ? "checked" : ""} class='check_task'>`)
        $(state ? "#todosFinished" : "#todosArea").append(todo.prop("outerHTML"))
        todo.remove()


        let new_tasks = goal_id.map(function () {
            return $(this).text();
        }).get()

        let array_id = Number(goal_id.eq(position).html())
        window.goalsAPI.changeChecksGoal({id: array_id, state: state})
        if ($('#todosAll').length) window.goalsAPI.rowsChange({after: new_tasks})

        this.build_finished_count()
        this.dragula_day_view()
    }
}

export class Input {
    /**
     * Creates new goal by
     * getting goal name, creating new goal dict, adds to proper destination
     * saves to the sql
     */
    constructor(app_data, app_date, app_steps, app_project, app_dayView) {
        this.initEventListerers()

        this.data = app_data
        this.date = app_date
        this.steps = app_steps
        this.project = app_project
        this.dayView = app_dayView
    }

    initEventListerers() {
        $(document).on('click', '#todoAdd', (event) => {
            event.stopPropagation()
            this.new_goal()
        })

        $(document).on('keyup', '#todoEntrySimple', (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) this.new_goal()
        });

        $(document).on('click', ".repeatOption", (event) => {
            event.stopPropagation()
            this.select_repeat_option(event.currentTarget)
        })
    }

    new_goal() {
        let e_todo = $('#todoEntryGet')
        let goal_text = e_todo.val()
        e_todo.val('')

        if (goal_text.trim() !== "") {
            let repeat_option = this.get_repeat_option()
            let steps = this._new_goal_steps()
            console.log(steps)
            let goal = this._new_goal_dict(goal_text, steps, repeat_option)

            if (!$('#projectHeader').length) {
                $('#todosArea').append(this.dayView.build_goal(goal))
                goal['project_pos'] = -1
            } else {
                $('#projectTodo .projectSectionGoals').append(this.project.build_project_goal(goal))
                goal['project_pos'] = $('#projectId').text()
            }

            goal['goal'] = encode_text(goal_text)
            goal['steps'] = steps
            goal['dates'] = this.date.get_repeat_dates(repeat_option)
            goal['note'] = ""

            window.goalsAPI.newGoal(goal)
        }
    }


    /**
     * creates dictionary of goal settings
     * @param goal_text goal name
     * @param steps steps settings
     * @param repeat repeat option
     * @returns dict of goal parameters
     */
    _new_goal_dict(goal_text, steps, repeat) {
        let difficulty = $('#range1').val()
        let importance = $('#range2').val()

        let new_category = getIdByColor(this.data.categories, $('#selectCategory1').css('backgroundColor'))
        return {
            goal: goal_text,
            steps: this.steps._steps_HTML(steps, new_category),
            category: new_category,
            importance: importance,
            difficulty: difficulty,
            knot_id: !isNaN(repeat)
        }
    }

    /**
     * selects repeat option
     * checks current repeat option, if the same repeat cancels
     * if different or was no option it gets selected
     * @param that selected repeat option
     */
    select_repeat_option(that) {
        let new_repeat = $('.repeatOption').index(that)
        let current_repeat = this.get_repeat_option()

        $("#repeatPicker").toggle()

        if (!isNaN(current_repeat) && current_repeat === new_repeat) {
            $(".repeatOption").css("background-color", "#282828")
            $('#repeatImg').attr('src', `./images/goals/repeat.png`)
        } else {
            $(".repeatOption").css("background-color", "#282828")
            $(that).css("background-color", "#3E3C4B")
            $('#repeatImg').attr('src', `./images/goals/repeat${new_repeat}.png`)
        }
    }

    /**
     * Gets repeat option from current repeat option
     * @returns {number}
     */
    get_repeat_option() {
        let repeat_path = $('#repeatImg').attr('src')
        let lastDotIndex = repeat_path.lastIndexOf('.');
        return Number(repeat_path[lastDotIndex - 1])
    }

    /**
     * creates steps ready to goal building
     * @returns {array} array of steps from new goal creatiion
     */
    _new_goal_steps() {
        let steps = []

        let steps_elements = $('.stepEntry')
        for (let i = 0; i < steps_elements.length; i++) {
            let step_value = steps_elements[i].value
            if (step_value !== "") steps.push({
                step_text: encode_text(step_value),
                step_check: 0
            })
        }

        if (steps.length) {
            $('#newSteps').html(`
            <div class="newStepText">
                <input type="text" class="stepEntry" placeholder="Action 1">
            </div>`)
        }

        return steps
    }
}

export class Steps {
    constructor(app_data) {
        this.initEventListeners()

        this.data = app_data
    }

    initEventListeners() {

        $(document).on('change', '.stepEntry', (event) => {
            this.new_step_entry(event.currentTarget)
        });

        $(document).on('keydown', '.stepEntry', (event) => {
            this.change_step_entry(event.currentTarget, event)
        });


    }

    /**
     * switches css steps of goal
     * resets drag
     * @param event1
     */
    show_steps(event1) {
        const steps = $(event1.target).closest(".taskText").find('.steps')
        let show = steps.css("display") === "block"
        steps.css("display", show ? 'none' : 'block')
        $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
    }

    /**
     * make new step entry in new goal input if edited is current last entry
     * @param that selected step entry in new goal input
     */
    new_step_entry(that) {
        let input_count = $(".stepEntry").length
        if ($('.stepEntry').index(that) === input_count - 1) {
            $('#newSteps').append(`
            <div class="newStepText">
                <input type='text' class='stepEntry' placeholder="Action ${input_count + 1}">
            </div>`)
        }
    }

    /**
     * step change in new goal input for tab click
     * if tab is from the last and value is not empty, step entry it creates new step and go to it
     * else if the value is empty it does nothing
     * @param that selected step in new goal input
     * @param event event of .stepEntry
     */
    change_step_entry(that, event) {
        if (event.which === 9) {
            let step_entry = $('.stepEntry')
            if (step_entry.index(that) === step_entry.length - 1 && $(that).val() !== "") {
                event.preventDefault();

                $('#newSteps').append(`
                <div class="newStepText">
                    <input type='text' class='stepEntry' placeholder="Action ${step_entry.length + 1}">
                </div>`)

                step_entry = $('.stepEntry')
                step_entry.eq(step_entry.length - 1).focus()
            } else if ($(that).val() === "") {
                event.preventDefault();
            }
        }
    }

    /**
     * changes check of selected step
     * @param that selected step
     */
    change_step_check(that) {
        const step_check = $('.stepCheck')
        let step_id_rel = $(that).closest('.step').index()
        let goal_id = $(that).closest('.todo').find('.todoId').text()

        let step_id_unrel = step_check.index(that)
        let counter_html = $(that).closest(".todo").find('.counter').get(0)
        if (that.checked) {
            step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' checked class='stepCheck'>")
            counter_html.innerText = Number(counter_html.innerText) + 1
        } else {
            step_check.eq(step_id_unrel).replaceWith("<input type='checkbox' class='stepCheck'>")
            counter_html.innerText = Number(counter_html.innerText) - 1
        }

        window.goalsAPI.changeChecksStep({id: goal_id, step_id: step_id_rel, state: Number(that.checked)})
    }

    _steps_HTML(steps, category_id) {
        let steps_HTML = ""
        if (steps.length > 0) {
            let checks_counter = steps.reduce((total, step) => total + step.step_check, 0);

            let steps_elements = ""
            for (let i = 0; i < steps.length; i++) {
                let step_check = steps[i].step_check ? "checked" : ""
                let converted_step = decode_text(steps[i].step_text)
                steps_elements +=
                    `<div class='step'>
                    <input type='checkbox' ${step_check} class='stepCheck'> <span class="step_text">${converted_step}</span>
                </div>`
            }

            let category_color = this.data.categories[category_id][0]
            steps_HTML =
                `<div class='stepsShow' style="background: ${category_color}">
                <img class='showImg' src='images/goals/down.png' alt="">
                <span class="check_counter">
                    <span class="counter">${checks_counter}</span>/<span class="maxCounter">${steps.length}</span>
                </span>
            </div>
            <div class='steps'>
                ${steps_elements}
            </div>`
        }
        return steps_HTML
    }
}





