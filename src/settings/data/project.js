export class ProjectsSettings {
    constructor(app) {
        this.app = app
        this.projects = []
        this.project_conn = []

        this.icons = []

        this.merged_icons = []
        this.project_icons = []
        this.appDataPath = ""

    }

    async init(hard = false) {
        this.projects = await this.app.services.data_getter2('get-projects', {})
        this.icons = await this.get_icons()
        // this.project_conn = await window.dataAPI.getGalacticConnections()
        // await this.loadIcons()
        // await this.loadProjectIcons()
    }

    async loadProjectIcons() {
        this.project_icons = []
        const result = await window.electronAPI.getProjectIcons();
        let icons_imported = result['files']

        this.appDataPath = result['appDataPath']
        for (let i = 0; i < icons_imported.length; i++) {
            this.project_icons.push(icons_imported[i])
        }
    }

    async get_icons() {
        return await this.app.services.data_getter('get-icons')
    }

    async loadIcons() {
        this.merged_icons = JSON.parse(JSON.stringify(this.icons));

        const result = await window.electronAPI.getIcons();
        let icons_imported = result['files']
        for (let i = 0; i < icons_imported.length; i++) {
            this.merged_icons.push(icons_imported[i])
        }
    }

    get_project_icon_path(project_id) {
        return `${this.appDataPath}\\project${project_id}.png`
    }

    findNameByPath = (path) => {
        const icon = this.merged_icons.find(icon => icon.path === path);
        return icon ? icon.name : null;
    };

    findProjectPathByName = (name) => {
        const icon = this.project_icons.find(icon => icon.name === name);
        return icon ? icon.path : null;
    };

    /**
     * builds html of project emblem
     * @param project_pos
     * @returns {string} returns HTML
     */
    project_emblem_html(project_id) {
        let project_emblem = ''
        if (project_id !== undefined && project_id !== null && project_id !== '-1') {
            let selected_project = this.projects.find(project => project.publicId === project_id)
            let project_color = this.app.settings.data.categories.categories[selected_project.categoryPublicId][0]
            project_emblem = `
            <div class="projectEmblem" style="color: ${project_color}">
                ${selected_project['svgIcon']}
                <div class="projectPos">${project_id}</div>
            </div>
        `
        }
        return project_emblem
    }

    /**
     * sets projects options on dashboard and sidebar
     * @param projects data of projects ,
     */
    set_projects_options() {
        let project_types_HTML = ""
        for (let i = 0; i < this.projects.length; i++) {
            project_types_HTML += this._type_project_HTML(this.projects[i])
        }
        $('#projectTypes').html(project_types_HTML)
    }

    /**
     * Making html format of project type on sidebar
     * @param icon_color color of the project option
     * @param icon icon name in path
     * @param name name of project
     * @returns {string} HTML format
     * @private
     */
    _type_project_HTML(project) {
        let project_color = this.app.settings.data.categories.categories[project.categoryPublicId][0]

        return `
        <div class="projectType" style="border: 1px solid ${project_color}; color: ${project_color}">
            <div class="projectTypeId">${project.publicId}</div>
            ${project.svgIcon}
            <div class="projectName" style="border: 1px solid ${project_color}">
                ${project.name}
            </div>
        </div>`
    }
}
