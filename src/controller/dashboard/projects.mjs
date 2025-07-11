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
            $('#dashStrategyProjects').append(this.render_project(project))
        }
    }

    render_project(project) {
        let project_color = this.app.settings.data.categories.categories[project.categoryPublicId][0]

        return `
            <div class="dashButton dashProject">
                <div class="dashButtonIcon" style="color: ${project_color}">
                    ${project['svgIcon']}
                </div>
                <div>${project['name']}</div>
                <div class="dashProjectId">${project['publicId']}</div>
            </div>
        `
    }
}