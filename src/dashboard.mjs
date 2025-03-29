export class Dashboard {
    constructor(app_data, app_date) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date

    }

    initEventListeners() {

        $(document).on('click', '#dashStrategyMore', () => {
            let is_more = $('#dashStrategyMore').text() === 'More'

            this.fix_dashboard(is_more)
            this.change_dashboard_strategy(is_more)
        })

        $(document).on('click', '.dashButton', (event) => {
            $('.dashButton').css('background-color', '')
            $(event.currentTarget).css('background-color', '#383838')

            if ($(event.currentTarget).attr('id') === 'dashMyDayBtn') $('#dashPlanOptions').css('display', 'block')
            else $('#dashPlanOptions').css('display', 'none')

        })
    }

    /**
     * Builds dashboard
     * @param length_option if true it builds dashboard with all projects
     * if false it builds dashboard with 3 projects
     */
    fix_dashboard(length_option) {
        $('#dashStrategyProjects').empty()
        let length = this.data.projects.length;
        if (length_option) length = this.data.projects.length
        else if (length > 3) {
            length = 3
        }

        for (let i = 0; i < length; i++) {
            let project = this.data.projects[i]
            let icon = this.data.findProjectPathByName(`project${project.id}`)
            let icon_path = this.data.findProjectPathByName(`project${project.id}`)
            $('#dashStrategyProjects').append(`
                <div class="dashButton dashProject">
                    <div class="dashButtonIcon">
                        <img src="${icon_path}" alt="">
                    </div>
                    <div>${project.name}</div>
                    <div class="dashProjectId">${project.id}</div>
                </div>
            `)
        }
    }

    change_dashboard_strategy(more_option) {
        if (more_option) $('#dashStrategyMore').text('Less')
        else $('#dashStrategyMore').text('More')
    }
}