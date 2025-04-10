

export class Project {
    constructor(app_todo) {
        this.initEventListeners()
        this.todo = app_todo
        // this.date = app_date
        // this.steps = app_steps

        this.project_pos = null
        this.project_id = null

        this.selected_project = null
    }

    initEventListeners() {
        window.projectsAPI.projectToGoal((steps, position) => this.get_goal_from_sidebar(steps, position))

        $(document).on('click', '#sideProjectGoals .check_task', (event) => {
            event.stopPropagation()
            this.check_sidebar_project_goal(event.currentTarget)
        })

        $(document).on('click', '#sideProjectClose', () => this.todo.appSettings.data.show_hide_sidebar(true, 1))
    }


    /**
     * opens sidebar and displays project sidebar
     */
    async show_project_sidebar(that) {
        this.project_id = Number($(that).find('.projectTypeId').text())
        this.selected_project = this.todo.appSettings.data.projects.projects.find(project => project.id === this.project_id)

        let color = this.todo.appSettings.data.categories.categories[this.selected_project['category']][0]
        let icon = this.todo.appSettings.data.projects.findProjectPathByName(`project${this.selected_project['id']}`)
        let name = this.selected_project['name']
        this.todo.appSettings.data.show_hide_sidebar(true, 0)

        $('#rightbar').html(`
            <div id="sideProjectHeader">
                <div id="sideProjectClose">⨉</div>
                <div id="sideProjectIcon">
                    <img src="${icon}" alt="">               
                </div>
                <div id="sideProjectTitle" style="border: 1px solid ${color}">
                    <img src="../src/images/goals/polaura.png" alt="">
                    <span>${name}</span>
                    <img class="polaura2" src="../src/images/goals/polaura.png" alt="">
                </div>
                <div id="sideProjectId">${this.project_id}</div>
            </div>
            
            <div id="sideProjectsubTitle">To do</div>
            <div id="sideProjectGoals">
                
            </div>`)

        let goals = await window.projectsAPI.askProjectSidebar({
            id: this.project_id,
            option: 2,
            current_dates: this.todo.appSettings.date.get_current_dates()
        })

        this.build_project_sidebar(goals)
        this.todo.todoViews.planViews.dayView.dragula_day_view()
    }

    build_project_sidebar(goals) {
        this.current_goal_id = 0
        let side_project_goals = $('#sideProjectGoals')
        side_project_goals.html("")

        for (let i = 0; i < goals.length; i++) {
            side_project_goals.append(this.todo.todoViews.projectView.build_project_goal(goals[i]))
        }
    }

    check_sidebar_project_goal(selected_check) {
        let check_state = !$(selected_check).prop('checked')
        let todo = $(selected_check).closest('.todo')

        let goal_index = todo.find('.todoId').text()

        todo.remove()

        if (check_state) {
            window.goalsAPI.goalRemoveDate({id: goal_index, option: 1})
        } else {
            window.goalsAPI.changeChecksGoal({id: goal_index, state: 1, option: 1})
        }
    }

    /**
     * adds steps to the project from project sidebar
     * @param steps steps data
     * @param position position of dragged goal
     */
    get_goal_from_sidebar(steps, position) {
        this.change_order()
        let category = this.todo.appSettings.data.getIdByColor(this.todo.appSettings.data.categories.categories, $('#main .todoCheck').eq(position).css('backgroundColor'))

        if ($('#todosAll').length) $('#main .taskText').eq(position).append(this.todo.todoComponents.steps._steps_HTML(steps, category))
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
}




