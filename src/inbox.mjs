export class Inbox {
    constructor(app_data, app_date) {
        this.data = app_data
        this.date = app_date
        this.decision_maker = new DecisionMaker(app_data, app_date)
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', "#dashInbox", async () => {
            await this.build_view()
        })


        $(document).on('click', '#inboxAdd', () => {
            this.new_goal()
        })

        $(document).on('click', '#inboxList .check_task', (event) => {
            event.stopPropagation()
            this.check_goal(event.currentTarget)
        });

        $(document).on('click', '.inboxDecision', () => {

        })


    }

    /**
     * build view of inbox
     * gets from inbox template
     * builds goals and then adds titles depends on day
     */
    async build_view() {
        const main_template = $('#inboxMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        let goals = await window.inboxAPI.getInbox()
        let breaks = this.date.get_inbox_sections(goals)
        let titles = ['Today', 'Last 7 days', 'Last 30 days', 'Later']

        for (let i = 0; i < goals.length; i++) {
            this.add_todo(goals[i]["name"], 1)
        }

        let current_break = 0
        for (let i = 0; i < breaks.length; i++) {
            if (breaks[i] !== -1) {
                $('#inboxList').children().eq(breaks[i] + current_break).before(`<div class="inboxListBreak">${titles[i]}</div>`)
                current_break++
            }
        }
    }

    /**
     * Builds from template inbox task
     * @param name inbox task name
     * @param way decides if add at the beginning or at the end of list
     */
    add_todo(name, way) {
        const template = $('#inboxTodoTemplate').prop('content');
        let id = $('.inboxTodo').length
        let $clone = $(template).clone()
        $clone.find('.inboxTodoId').text(id);
        $clone.find('.task').text(name);

        if (way) {
            $('#inboxList').append($clone)
        } else {
            let $first_break = $('.inboxListBreak').eq(0)
            if ($first_break.text() === "Today") {
                $first_break.after($clone)
            } else {
                $('#inboxList').prepend($clone)
                $('#inboxList').prepend(`<div class="inboxListBreak">Today</div>`)
            }
        }
    }

    /**
     * gets input value and clears it
     * add new goal to server side
     * builds new goal
     */
    new_goal() {
        let $inbox_input = $('#inboxInput')
        let name = $inbox_input.val()
        $inbox_input.val("")

        window.inboxAPI.newInboxGoal({'name': name, "add_date": this.date.today_sql})
        this.add_todo(name, 0)
    }

    /**
     * gets postion id of task
     * check send to server side
     * removes selected goal and goal ids
     * fixes positions, if id of task id is greater than remove one
     *      it changes id to its id - 1
     * @param selected_check event current target
     */
    check_goal(selected_check) {
        let $selected_todo = $(selected_check).closest('.inboxTodo')
        let selected_todo_id = $selected_todo.find('.inboxTodoId').text()

        window.inboxAPI.checkInboxGoal({'position': selected_todo_id})

        let $previous_element = $selected_todo.prev()
        let $next_element = $selected_todo.next()
        if ($previous_element.attr('class') === "inboxListBreak" &&
            ($next_element.attr('class') === "inboxListBreak" || $next_element.length === 0)) {
            $previous_element.remove()
        }
        $selected_todo.remove()

        let $inbox_todo_ids = $(".inboxTodoId")
        for (let i = 0; i < $inbox_todo_ids.length; i++) {
            let todo_id = $inbox_todo_ids.eq(i).text()
            if (selected_todo_id < todo_id) {
                $inbox_todo_ids.eq(i).text(todo_id - 1)
            }

        }
    }
}

class DecisionMaker {
    constructor(app_data, app_date) {
        this.data = app_data
        this.date = app_date
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '.inboxDecision', () => {
            $("#vignette").css('display', 'block')
            $("#taskEdit").css('display', 'block')

            this.open()
        })


        $(document).on('click', '#decisionActionYes', () => {
            $('#decisionActionYes').css('border', '1px solid #2979FF')
            $('#decisionWhen').css('display', 'block')
        })

        $(document).on('click', '#decisionFutureType', () => {
            if ($('#decisionFutureTypeDate').css('display') === 'flex'){
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
            if(!$(event.target).closest('#categoryDecider').length && !$(event.target).closest('#categoryDeciderSelect').length){
                $("#categoryDeciderSelect").remove()
            }

            if(!$(event.target).closest('#projectDecider').length && !$(event.target).closest('#projectDeciderSelect').length){
                $("#projectDeciderSelect").remove()
            }
        })


    }

    open(){
        let $decision_clone = $("<div id='decisionMaker' class='vignetteWindow2'></div>")
        const edit_main_template = $('#editMainTemplate').prop('content');
        $decision_clone.append($(edit_main_template).clone())

        const decision_right_template = $('#decisionRightTemplate').prop('content');
        $decision_clone.find('#editBody').append($(decision_right_template).clone())
        $("#vignette").append($decision_clone)
    }
}

