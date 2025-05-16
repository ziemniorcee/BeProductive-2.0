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

        let project_id = Number($('#projectId').text())
        window.projectsAPI.deleteProject({id: project_id})
        this.app.settings.data.projects.projects = this.app.settings.data.projects.projects.filter(item => item.id !== project_id);

        this.app.settings.data.projects.set_projects_options()
        await this.app.todo.todoViews.planViews.dayView.display()
    }
}
