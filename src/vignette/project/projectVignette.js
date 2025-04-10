import {DeleteProject} from "./deleteProject.js";
import {NewProject} from "./newProject.js";

export class ProjectVignette {
    constructor(app) {
        this.app = app
        this.deleteProject = new DeleteProject(app)
        this.newProject = new NewProject(app)
    }
}