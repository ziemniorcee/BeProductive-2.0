import {DashboardProjects} from "./projects.mjs";
import {Tests} from "./tests.js";

export class AppDashboard {
    constructor(app) {
        this.app = app
        this.projects = new DashboardProjects(app)
        this.tests = new Tests(app)
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '#dashLogin', () => {
            this.app.vignette.loginVignette.display()
        })

        $('#dashStrategyMore').on('click', () => {
            this.show_more_projects()
        })

        $(document).on('click', '.dashButton', (event) => {
            this.press_dashboard_button(event)
        })

        $(document).on('click', '#dashMyDayBtn', async () => {
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'none');
            this.app.settings.date.set_attributes(this.app.settings.date.today)
            await this.app.todo.todoViews.planViews.dayView.display()
        })

        $(document).on('click', '#dashMyDay', async () => {
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'none');
            await this.app.todo.todoViews.myDayView.display()
        })

        $(document).on('click', '#dayViewButton, #dayViewButton2', async () => {
            await this.app.todo.todoViews.planViews.dayView.display()
        })

        $(document).on('click', '#weekViewButton, #weekViewButton2', async () => {
            await this.app.todo.todoViews.planViews.weekView.display()
        })

        $(document).on('click', '#monthViewButton, #monthViewButton2', async () => {
            await this.app.todo.todoViews.planViews.monthView.display()
        })

        $(document).on('click', "#dashInbox", async () => {
            await this.app.todo.todoViews.inboxView.display()
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'none');
        })

        $(document).on('click', "#dashASAP", async () => {
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'none');
            await this.app.todo.todoViews.asapView.display()
        })

        $(document).on('click', '.dashProject', async(event) => {
            await this.app.todo.todoViews.projectView.display(event.currentTarget)
        })

        $(document).on('click', '#dashboardStrategyAddProject', async () => {
            // await this.app.projects.new_project()
        })

        $(document).on('click', '#strategyButton', () => {
            $('#habit').css('display', 'none');
            $('#galactics').css('display', 'block');
            this.app.strategy.add_galactic_category_boxes();
            $('#galactic-editor').remove();
        })

        $(document).on('click', '#todoButton', () => {
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'none');
            this.app.strategy.clearEditorInterval();
        })

        $(document).on('click', '#habitButton', () => {
            $('#galactics').css('display', 'none');
            $('#habit').css('display', 'flex');
            if (this.app.habits.is_today) this.app.habits.refresh_today_habits();
            else this.app.habits.refresh_tomorrow_habits();
            this.app.habits.update_chart();
        })

        $(document).on('click', '#dashClose, #dashOpen', () => {
            $('#dashboard').toggle()
            $('#dashOpen').toggle();
        })
    }

    show_more_projects() {
        let is_more = $('#dashStrategyMore').text() === 'More'

        this.projects.build(is_more)
        this.change_dashboard_strategy(is_more)
    }

    press_dashboard_button(pressed_button) {
        $('.dashButton').css('background-color', '')
        $(pressed_button.currentTarget).css('background-color', '#383838')

        if ($(pressed_button.currentTarget).attr('id') === 'dashMyDayBtn') {
            $('#dashPlanOptions').css('display', 'block')
        }
        else $('#dashPlanOptions').css('display', 'none')
    }

    change_dashboard_strategy(more_option) {
        if (more_option) $('#dashStrategyMore').text('Less')
        else $('#dashStrategyMore').text('More')
    }
}
