import {Deciders} from "./deciders.mjs";
import {TodoVignette} from "./todo/todoVignette.mjs";
import {ProjectVignette} from "./project/projectVignette.js";
import {DecisionMaker} from "./inboxDecision.js";

export class Vignette {
    constructor(app) {
        this.app = app
        this.todoVignette = new TodoVignette(app)
        this.projectVignette = new ProjectVignette(app)
        this.decision_maker = new DecisionMaker(app)
        this.deciders = new Deciders(app.settings)
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('mousedown', '#vignette', async () => {
            if ($('#taskEdit').length) {
                await this.todoVignette.todo_edit.change_goal()
                this.app.todo.todoViews.planViews.dayView.dragula_day_view()
            } else if ($('#newTask').length) {
                await this.todoVignette.todo_new.add_goal()
            } else if ($('#newProjectTask').length) {
                await this.todoVignette.todo_project_new.add_goal()
            }
            $('#vignette').css('display', 'none');
            $('#vignette').html('')
        })

        $(document).on('click', '#taskEdit', function (event){
            event.stopPropagation()
        })

        $(document).on('mousedown', '#vignette2', function (){
            $('#vignette2').css('display', 'none');
            $('#vignette2').html('')
        })

        $(document).on('mousedown', '.vignetteWindow2, .vignetteWindow1', function (event){
            event.stopPropagation()
        })

    }
}




