export class TodoNew {
    constructor(app) {
        this.initEventListeners()
        this.app = app
    }

    initEventListeners(){
        $(document).on('click', '#todosAddNew', (event) => {
            this.build_adder()
        })
    }

    build_adder(){
        $("#vignette").css('display', 'block')
        let $edit_clone = $("<div id='newTask' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $edit_clone.append($(edit_main_template).clone())
        const edit_right_template = $('#editRightTemplate').prop('content');
        $edit_clone.find('#editBody').append($(edit_right_template).clone())
        $edit_clone.find('#selectDate').text(this.app.settings.date.change_to_edit_format(this.app.settings.date.day_sql))
        $("#vignette").append($edit_clone)

        $(function () {
            $("#editDatePicker").datepicker({
                dateFormat: "dd.mm.yy",
                onSelect: function (selectedDate) {
                    $('#selectDate').text(selectedDate)
                    $('#editDateSelector').css('display', 'none')
                }
            });
        });
    }

    async add_goal(){
        let changes = await this.app.vignette.todoVignette.get_goal_settings()
        changes['goal_pos'] = ('#todosArea .todo').length + 1
        let new_goal_settings = await window.goalsAPI.newGoal2({changes: changes})
        changes['id'] = new_goal_settings[0]
        changes['check_state'] = 0
        changes['steps'] = this.app.todo.todoComponents.steps._steps_HTML(new_goal_settings[1], changes['category'])
        if (changes['addDate'] === this.app.settings.date.day_sql) {
            $('#todosArea').append(this.app.todo.todoViews.planViews.dayView.build_goal(changes))
        }
    }
}
