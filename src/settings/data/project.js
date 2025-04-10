export class ProjectsSettings {
    constructor(app_data) {
        this.app_data = app_data
        this.projects = []
        this.project_conn = []

        this.icons = [{
            name: "book",
            path: "images/goals/projects/book.png"
        }, {
            name: "bug",
            path: "images/goals/projects/bug.png"
        }, {
            name: "dashboard",
            path: "images/goals/projects/dashboard.png"
        }, {
            name: "keys",
            path: "images/goals/projects/keys.png"
        }, {
            name: "productivity",
            path: "images/goals/projects/productivity.png"
        }]

        this.merged_icons = []
        this.project_icons = []
        this.appDataPath = ""

    }

    async init() {
        this.projects = await window.dataAPI.getProjects()
        this.project_conn = await window.dataAPI.getGalacticConnections()

        await this.loadIcons()
        await this.loadProjectIcons()
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
        const project = this.projects.find(item => item.id === project_id);
        let project_emblem = ''
        if (project_id !== -1 && project_id !== null) {
            let project_icon = this.findProjectPathByName(`project${project_id}`)

            project_emblem = `
            <div class="projectEmblem" >
                <img src="${project_icon}" alt="">
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
            let current_project = this.projects[i]
            let icon_color = this.app_data.categories.categories[current_project.category][0]
            let icon_path = this.findProjectPathByName(`project${current_project.id}`)

            project_types_HTML += this._type_project_HTML(icon_color, icon_path, current_project["name"], current_project["id"])
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
    _type_project_HTML(icon_color, icon, name, id) {
        return `
        <div class="projectType" style="border: 1px solid ${icon_color}">
            <div class="projectTypeId">${id}</div>
            <img class="projectTypeImg" src="${icon}" alt="">
            <div class="projectName" style="border: 1px solid ${icon_color}">
                ${name}
            </div>
        </div>`
    }
}
