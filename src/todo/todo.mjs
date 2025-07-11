import {TodoViews} from "./views/views.mjs";
import {TodoComponents} from "./components/components.js";
import {Project} from "./project.mjs";

export class Todo {
    constructor(app) {
        this.todoComponents = new TodoComponents(app)
        this.todoViews = new TodoViews(app)
        this.project = new Project(this)
    }
}

