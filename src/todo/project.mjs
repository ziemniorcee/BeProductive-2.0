export class Project {
    constructor(app) {
        this.initEventListeners()
        this.app = app

        this.project_pos = null
        this.project_id = null

        this.selected_project = null
    }

    initEventListeners() {

        $(document).on('click', '#sideProjectGoals .check_task', async (event) => {
            event.stopPropagation()
            await this.check_sidebar_project_goal(event.currentTarget)
        })

        $(document).on('click', '#sideProjectClose', () => this.app.settings.data.show_hide_sidebar(true, 1))
    }


    /**
     * opens sidebar and displays project sidebar
     */
    async show_project_sidebar(that) {
        this.project_id = $(that).find('.projectTypeId').text()
        this.selected_project = this.app.settings.data.projects.projects.find(project => project.publicId === this.project_id)
        let color = this.app.settings.data.categories.categories[this.selected_project['categoryPublicId']][0]
        let name = this.selected_project['name']
        this.app.settings.data.show_hide_sidebar(true, 0)

        $('#rightbar').html(`
            <div id="sideProjectHeader">
                <div id="sideProjectClose">⨉</div>
                <div id="sideProjectIcon" style="color: ${color}">
                    ${this.selected_project['svgIcon']}
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

        let params = {id: this.project_id, current_dates: this.app.settings.date.get_current_dates()}
        let goals = await this.app.services.data_getter('ask-project-sidebar', params)
        this.build_project_sidebar(goals)
        this.app.todo.todoViews.planViews.dayView.dragula_day_view()
    }

    build_project_sidebar(goals) {
        let side_project_goals = $('#sideProjectGoals')
        side_project_goals.html("")

        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = []
            side_project_goals.append(this.app.todo.todoViews.projectView.build_project_goal(goals[i]))
        }
    }

    async check_sidebar_project_goal(selected_check) {
        let check_state = !$(selected_check).prop('checked')
        let todo = $(selected_check).closest('.todo')

        let goal_index = todo.find('.todoId').text()

        todo.remove()

        if (check_state) {
            await this.app.services.data_updater('goal-remove-date', {id: goal_index}, 'PATCH')
        } else {
            await this.app.services.data_updater('change-checks-goal', {id: goal_index, state: 1}, 'PATCH')
        }
    }

    /**
     * adds steps to the project from project sidebar
     * @param steps steps data
     * @param position position of dragged goal
     */
    async get_goal_from_sidebar(date, id, position) {
        let steps = await this.app.services.data_updater('get-from-project', {id: id, new_date: date}, "PATCH")
        await this.change_order()
        if ($('#todosAll').length) $('#main .taskText').eq(position).append(this.app.todo.todoComponents.steps._steps_HTML(steps))
    }

    /**
     * fixes order of goals and saves it
     */
    async change_order() {
        let goals = $('#main .todoId')
        if ($('#monthGrid').length) goals = $('#main .monthTodoId')
        let order = []
        for (let i = 0; i < goals.length; i++) order.push(goals.eq(i).text())

        await this.app.services.data_updater('goals-reorder', {order: order}, 'PUT')
    }
}




