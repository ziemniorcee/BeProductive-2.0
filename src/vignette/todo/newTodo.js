export class TodoNew {
    constructor(app, todo_vignette) {
        this.initEventListeners()
        this.app = app
        this.vignette = todo_vignette
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
        let changes = await this.vignette.add_goal_core()

        if (changes['addDate'] === this.app.settings.date.day_sql) {
            $('#todosArea').append(this.app.todo.todoViews.planViews.dayView.build_goal(changes))
        }
    }
}
