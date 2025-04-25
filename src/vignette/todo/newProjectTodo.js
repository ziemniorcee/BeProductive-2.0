export class TodoProjectNew {
    constructor(app, todo_vignette) {
        this.initEventListeners()
        this.app = app
        this.vignette = todo_vignette
    }

    initEventListeners() {
        $(document).on('click', '#projectNewGoal', () => {
            this.build_adder()
        })
    }

    build_adder() {
        $("#vignette").css('display', 'block')
        let $edit_clone = $("<div id='newProjectTask' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $edit_clone.append($(edit_main_template).clone())
        const edit_right_template = $('#editRightTemplate').prop('content');
        $edit_clone.find('#editBody').append($(edit_right_template).clone())
        $edit_clone.find('#selectDate').text("None")

        let project_id = Number($('#projectId').text())
        let category_id = this.app.settings.data.projects.projects.find(project => project.id === project_id)['category']

        this.vignette.set_category(category_id, $edit_clone)
        this.vignette.set_project(project_id, $edit_clone)
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

    async add_goal() {
        let changes = await this.vignette.add_goal_core()
        $('#projectTodo').find('.projectSectionGoals').append(
            this.app.todo.todoViews.projectView.build_project_goal(changes)
        )
    }
}
