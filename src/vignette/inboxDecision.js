export class DecisionMaker {
    constructor(app) {
        this.app = app
        // this.vignette = app_vignette

        this.selected_goal = null
        this.goal_id = null
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '.inboxDecision', (event) => {
            $("#vignette").css('display', 'block')
            $("#taskEdit").css('display', 'block')

            this.selected_goal = $(event.currentTarget).closest('.inboxTodo')
            this.goal_id = $(event.currentTarget).closest('.inboxTodo').find('.inboxTodoId').text()

            this.open()
        })


        $(document).on('click', '#decisionActionYes', () => {
            $('#decisionActionYes').removeClass('deciderButtonEmpty').addClass('deciderButtonFilled')
            $('#decisionActionNo').removeClass('deciderButtonFilled').addClass('deciderButtonEmpty')
            $('#decisionWhen').css('display', 'block')
        })

        $(document).on('click', '#decisionActionNo', () => {
            $('#decisionActionNo').removeClass('deciderButtonEmpty').addClass('deciderButtonFilled')
            $('#decisionActionYes').removeClass('deciderButtonFilled').addClass('deciderButtonEmpty')
            $('#decisionWhen').css('display', 'None')
            $('#decisionFuture').css('display', 'None')
            $('#decisionEnd').css('display', 'flex')
        })

        $(document).on('click', '#decisionWhenFuture', () => {
            $('#decisionWhenFuture').removeClass('deciderButtonEmpty').addClass('deciderButtonFilled')
            $('#decisionWhenASAP').removeClass('deciderButtonFilled').addClass('deciderButtonEmpty')
            $('#decisionFuture').css('display', 'flex')
            $('#decisionEnd').css('display', 'flex')
        })

        $(document).on('click', '#decisionWhenASAP', () => {
            $('#decisionWhenASAP').removeClass('deciderButtonEmpty').addClass('deciderButtonFilled')
            $('#decisionWhenFuture').removeClass('deciderButtonFilled').addClass('deciderButtonEmpty')
            $('#decisionFuture').css('display', 'none')
            $('#decisionEnd').css('display', 'flex')
        })

        $(document).on('click', '#decisionFutureType', () => {
            if ($('#decisionFutureTypeDate').css('display') === 'flex') {
                $('#decisionFutureTypeDate').css('display', 'none')
                $('#decisionFutureTypeDeadline').css('display', 'flex')
                $('#decisionFutureType').css('justify-content', 'flex-end')
            } else {
                $('#decisionFutureTypeDate').css('display', 'flex')
                $('#decisionFutureTypeDeadline').css('display', 'none')
                $('#decisionFutureType').css('justify-content', 'flex-start')

            }
        })

        $(document).on('click', '#decisionMaker', (event) => {
            if (!$(event.target).closest('.categoryDecider').length && !$(event.target).closest('.categoryDeciderSelect').length) {
                $(".categoryDeciderSelect").remove()
            }

            if (!$(event.target).closest('.projectDecider').length && !$(event.target).closest('.projectDeciderSelect').length) {
                $(".projectDeciderSelect").remove()
            }

            if (!$(event.target).closest('.dateDecider').length && !$(event.target).closest('.dateDeciderSelect').length) {
                $(".dateDeciderSelect").css('display', 'none')
            }
        })

        $(document).on('click', '#decisionSave', () => {
            let decision_main_entry = $('#editMainEntry').val()
            let decision_note_entry = $('#editNoteEntry').val()
            let steps_array = this.app.vignette.todoVignette.get_steps()
            let category_id = Number($('.categoryDeciderId').text())
            console.log("pr id", $('.projectDeciderId').text())
            let project_id = Number($('.projectDeciderId').text())

            let date_type = 0
            let date = ""

            if ($('#decisionWhenFuture').attr('class') === 'deciderButtonFilled') {
                if ($("#decisionFutureTypeDeadline").css('display') === 'flex') {
                    date_type = 1
                }
                date = this.app.settings.date.get_edit_sql_format($("#decisionFutureDate").text())
            } else if ($('#decisionWhenASAP').attr('class') === 'deciderButtonFilled') {
                date_type = 2
            }

            let inbox_id = this.goal_id
            let goal = {
                inbox_id: inbox_id,
                goal: decision_main_entry,
                note: decision_note_entry,
                steps: steps_array,
                category_id: category_id,
                project_id: project_id,
                date: date,
                date_type: date_type,
            }


            window.inboxAPI.newGoalFromInbox(goal)
            $('#vignette').css('display', 'none');
            $('#vignette').html('')

            let $previous_element = this.selected_goal.prev()
            let $next_element = this.selected_goal.next()
            if ($previous_element.attr('class') === "inboxListBreak" &&
                ($next_element.attr('class') === "inboxListBreak" || $next_element.length === 0)) {
                $previous_element.remove()
            }
            this.selected_goal.remove()
        })
    }

    open() {
        $("body").get(0).style.setProperty("--decide-color", "#3B151F");

        let $decision_clone = $("<div id='decisionMaker' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $decision_clone.append($(edit_main_template).clone())

        const decision_right_template = $('#decisionRightTemplate').prop('content');
        $decision_clone.find('#editBody').append($(decision_right_template).clone())

        let date_formatted = this.app.settings.date.get_edit_date_format(this.app.settings.date.today)
        $decision_clone.find('.dateDecider').text(date_formatted)
        let goal_name = this.selected_goal.find('.taskText').text().trim()
        $decision_clone.find("#editMainEntry").val(goal_name)

        $("#vignette").append($decision_clone)

        $(function () {
            $("#decisionDatePicker").datepicker({
                dateFormat: "dd.mm.yy",
                onSelect: function (selectedDate) {
                    $('#decisionFutureDate').text(selectedDate)
                    $('.dateDeciderSelect').css('display', 'none')
                }
            });
        });


    }
}

