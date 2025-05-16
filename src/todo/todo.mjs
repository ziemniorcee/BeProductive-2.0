import {TodoViews} from "./views/views.mjs";
import {TodoComponents} from "./components/components.js";
import {Project} from "./project.mjs";

export class Todo {
    constructor(app_settings) {
        this.appSettings = app_settings
        this.todoComponents = new TodoComponents(app_settings)
        this.todoViews = new TodoViews(this)
        this.project = new Project(this)
    }
}

