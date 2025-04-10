export class DashboardProjects {
    constructor(app) {
        this.app = app
    }

    /**
     * Builds dashboard
     * @param length_option if true it builds dashboard with all projects
     * if false it builds dashboard with 3 projects
     */
    build(is_more) {
        $('#dashStrategyProjects').empty()
        let length = this.app.settings.data.projects.projects.length

        if (!is_more && length > 3) {
            length = 3
        }

        for (let i = 0; i < length; i++) {
            let project = this.app.settings.data.projects.projects[i]
            let icon_path = this.app.settings.data.projects.get_project_icon_path(project["id"])
            $('#dashStrategyProjects').append(this.render_project(project["name"], project["id"], icon_path))
        }
    }

    render_project(project_name, project_id, icon_path) {
        return `
            <div class="dashButton dashProject">
                <div class="dashButtonIcon">
                    <img src="${icon_path}" alt="">
                </div>
                <div>${project_name}</div>
                <div class="dashProjectId">${project_id}</div>
            </div>
        `
    }
}