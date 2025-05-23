import {PlanViews} from "./planViews/planViews.mjs";
import {ProjectView} from "./projectView.js";
import {InboxView} from "./inboxView.mjs";
import {AsapView} from "./asapView.mjs";
import {MyDayView} from "./myDay.js";

export class TodoViews {
    constructor(todo) {
        this.todo = todo
        this.planViews = new PlanViews(todo)
        this.projectView = new ProjectView(todo)
        this.inboxView = new InboxView(todo)
        this.asapView = new AsapView(todo)
        this.myDayView = new MyDayView(todo)

        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '.stepsShow', (event) => {
            event.stopPropagation()
            this.todo.todoComponents.steps.show_steps(event)
            if ($('#todosAll').length) this.planViews.dayView.dragula_day_view()
            else if ($('#projectContent').length) this.projectView.dragula_project_view()
        });
    }

    async init() {
        await this.myDayView.display()
    }
}