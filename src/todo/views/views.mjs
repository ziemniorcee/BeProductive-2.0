import {PlanViews} from "./planViews/planViews.mjs";
import {ProjectView} from "./projectView.js";
import {InboxView} from "./inboxView.mjs";
import {AsapView} from "./asapView.mjs";
import {MyDayView} from "./myDay.js";

export class TodoViews {
    constructor(app) {
        this.todo = app.todo
        this.planViews = new PlanViews(app)
        this.projectView = new ProjectView(app)
        this.inboxView = new InboxView(app)
        this.asapView = new AsapView(app)
        this.myDayView = new MyDayView(app)

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