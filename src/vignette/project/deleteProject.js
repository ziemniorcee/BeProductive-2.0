export class DeleteProject {
    constructor(app) {
        this.app = app

        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '#deleteProjectCancel', () => {
            $('#vignette').html('')
            $('#vignette').css('display', 'none')
        })

        $(document).on('click', '#deleteProjectConfirm', async () => await this.delete_project())
    }

    async delete_project() {
        $('#vignette').html('')
        $('#vignette').css('display', 'none')

        let project_id = $('#projectId').text()
        await this.app.services.data_deleter('remove-project', {id: project_id})
        this.app.settings.data.projects.projects = this.app.settings.data.projects.projects.filter(item => item.id !== project_id);

        await this.app.settings.data.projects.init()
        await this.app.controller.init()
        await this.app.todo.todoViews.planViews.dayView.display()


        let is_less = $('#dashStrategyMore').text() === 'Less'
        this.app.controller.appDashboard.projects.build(is_less)
    }
}
