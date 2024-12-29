import {Data, decode_text, weekdays2} from "./data.mjs";
import {Categories, DayView, Input, Steps} from "./render.mjs";
import {CurrentDate} from "./date.js";
import {create_today_graphs} from "./graph.mjs";
import {WeekView} from "./weekView.mjs";
import {Edit} from "./edit2.mjs";
import {MonthView} from "./monthView.mjs";
import {Project} from "./project.mjs";
import {HistorySidebar, Idea} from "./sidebar.mjs";
import {Inbox} from "./inbox.mjs";


class MainApp {
    constructor() {
        this.display_management = new DisplayManagement(this)
        this.data = new Data()
        this.date = new CurrentDate()
        this.categories = new Categories(this.data)
        this.steps = new Steps(this.data)

        this.history = new HistorySidebar(this.data, this.date, this.steps)
        this.idea = new Idea(this.data, this.date)
        this.edit = new Edit(this.data, this.date, this.categories, this.steps)
        this.project = new Project(this.data, this.date, this.categories, this.steps)
        this.inbox = new Inbox(this.date)

        this.dayView = new DayView(this.data, this.date, this.categories, this.steps)

        this.input = new Input(this.data, this.date, this.steps, this.project, this.dayView)
        this.weekView = new WeekView(this.data, this.date)
        this.monthView = new MonthView(this.data, this.date)
    }

    async init() {
        await this.data.loadIcons()
        await this.data.init()

        await this.dayView.display()
        this.project.set_projects_options()

        // create_today_graphs();
        // $('#graphLine1').show();
    }
}

class DisplayManagement{
    constructor(main_app) {
        this.initEventListeners()
        this.app = main_app
    }

    initEventListeners() {
        $(document).on('click', '#dashMyDayBtn', async () => {
            this.app.date.set_attributes(this.app.date.today)
            await this.app.dayView.display()
            await this.display_reset()
        })

        $(document).on('click', '#dashTomorrowBtn', async () => {
            this.app.date.set_attributes(this.app.date.tomorrow)
            await this.app.dayView.display()
            await this.display_reset()
        })

        $(document).on('click', '#dayViewButton', async () => {
            await this.app.dayView.display()
            await this.display_reset()
        })

        $(document).on('click', '#weekViewButton', async () => {
            await this.app.weekView.display()
            await this.display_reset()
        })

        $(document).on('click', '#goLeft', async () => {
            this.app.date.get_next_date(-1)
            if($('#todosAll').length) await this.app.dayView.display()
            else if ($('.weekDay').length) await this.app.weekView.display()
            else if ($('#monthGrid').length) await this.app.monthView.display()

            await this.display_reset()
        })

        $(document).on('click', '#goRight', async () => {
            this.app.date.get_next_date(1)
            if($('#todosAll').length) await this.app.dayView.display()
            else if ($('.weekDay').length) await this.app.weekView.display()
            else if ($('#monthGrid').length) await this.app.monthView.display()

            await this.display_reset()
        })

        $(document).on('mouseup', '.weekDay', async (event) => {
            if (event.which === 1 && event.target.className.includes("weekDayGoals")) {
                let day_index = weekdays2.indexOf($(event.currentTarget).find('.weekDayText').text())
                this.app.date.get_week_day(day_index)
                await this.app.dayView.display()
                await this.display_reset()
            }
        })

        $(document).on('mouseup', '.monthDay', async (event) => {
            if (event.which === 1 && event.target.className === "monthGoals") {
                let day_index = Number($(event.currentTarget).find('.monthDate').text())
                this.app.date.set_sql_month(day_index)
                await this.app.dayView.display()
                await this.display_reset()
            }
        })

        $("#datePicker").datepicker({
            onSelect: async (dateText, inst) => {
                const $input = inst.input;
                const selectedDate = $input.datepicker('getDate');
                this.app.date.set_attributes(selectedDate)

                if ($('#todosAll').length) {
                    await this.app.dayView.display()
                    $('#mainTitle').text(this.app.date.get_day_view_header())
                } else if ($('.weekDay').length) {
                    await this.app.weekView.display()
                    let header_params = this.app.date.get_header_week()
                    $('#mainTitle').text(header_params[0])
                    $('#date').text(header_params[1])
                } else {
                    await this.app.monthView.display()
                }
            }
        });

        $(document).on('click', '#monthViewButton', async () => {
            await this.app.monthView.display()
            this.app.project.set_projects_options()
            await this.app.project.fix_project_sidebar()
            await this.display_reset()
        })

        $(document).on('mousedown', '#vignette', () => {
            if ($('#taskEdit').length){
                let project_pos = this.app.project.project_pos
                this.app.edit.change_goal(project_pos)
                this.reset_dragula()
            }
            $('#vignette').css('display', 'none');
            $('#vignette').html('')
        })
        $(document).on('click', '#deleteProjectConfirm', async () => await this.delete_project())

        $(document).on('click', '.projectType', async (event) => {
            await this.app.project.show_project_sidebar(event.currentTarget)
            this.reset_dragula()
        });

        $(document).on('click', '.sideProjectOption', async (event) => {
            await this.app.project.change_sidebar_option(event.currentTarget)
            this.reset_dragula()
        })

        $(document).on('click', '#editMainCheck', () => {
            let position = this.app.edit.change_edit_check()

            if (!$('#projectContent').length) {
                this.app.dayView.change_main_check(position)
            } else {
                this.app.project.change_project_check(this.app.edit.selected_goal)
            }
            this.app.edit.selected_goal = $('#main .todo').eq(position)
        })

        $(document).on('click', '#sideHistory', async () => {
            await this.app.history.show_history_sidebar()
            this.reset_dragula()
        })

        window.sidebarAPI.historyToGoal((steps, goal) => this.history_to_goal(goal, steps))

        $(document).on('click', '.stepsShow', (event) => {
            event.stopPropagation()
            this.app.steps.show_steps(event)
            if ($('#todosAll').length) this.app.dayView.dragula_day_view()
            else if ($('#projectContent').length) this.app.project.dragula_project_view()
        });

        $(document).on('click', '.stepCheck', (event) => {
            event.stopPropagation()
            this.app.steps.change_step_check(event.currentTarget)

            if ($('#todosAll').length) this.app.dayView.dragula_day_view()
            else if ($('#projectContent').length) this.app.project.dragula_project_view()
        });

    }

    async display_reset (){
        this.app.project.set_projects_options()
        await this.app.project.fix_project_sidebar()
        this.reset_dragula()
    }

    async delete_project() {
        window.projectsAPI.deleteProject({position: this.app.project.project_pos})

        $('#vignette').html('')
        $('#vignette').css('display', 'none')
        this.app.data.projects.splice(this.app.project.project_pos, 1)

        this.app.project.set_projects_options()
        await this.app.dayView.display()
    }

    reset_dragula(){
        if ($('#todosAll').length) this.app.dayView.dragula_day_view()
        else if ($('.weekDay').length) this.app.weekView.dragula_week_view()
        else this.app.monthView.dragula_month_view()
    }

    /**
     * Builds goal with given history goal data
     * @param goal data of goal
     * @param steps data of steps
     */
    history_to_goal(goal, steps) {
        let todos

        if ($('#todosAll').length) {
            goal['steps'] = this.app.steps._steps_HTML(this.app.history._prepare_steps(steps), goal.category)
            goal['goal'] = decode_text(goal['goal'])

            $("#todosArea").append(this.app.dayView.build_goal(goal))
            todos = $('#todosArea').children()
        } else if ($('.weekDay').length) {
            let week_day = $('.weekDayGoals .sidebarTask').closest('.weekDayGoals')
            week_day.append(this.app.weekView.build_week_goal(goal, $('.todo').length))
            todos = week_day.children()
        } else {
            let month_day = $('.monthGoals .sidebarTask').closest('.monthGoals')
            month_day.append(this.app.monthView.build_month_goal(goal, $('.monthTodo').length))
            todos = month_day.children()
        }
        this.app.history._fix_order(todos)
    }
}

const app = new MainApp();

(async () => {
    await app.init()
})();