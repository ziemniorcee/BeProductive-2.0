export class InboxView {
    constructor(todo) {
        this.todo = todo
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '#inboxAdd', async () => {
            await this.new_goal()
        })

        $(document).on('click', '#inboxList .check_task', (event) => {
            event.stopPropagation()
            this.check_goal(event.currentTarget)
        });

        $(document).on('focus', '#inboxInput', function (){
            $('#inboxEntry').css('background-color', "#1A3667")
        })

        $(document).on('blur', '#inboxInput', function (){
            $('#inboxEntry').css('background-color', "#2A2A2A")
        })
    }

    /**
     * build view of inbox
     * gets from inbox template
     * builds goals and then adds titles depends on day
     */
    async display() {
        const main_template = $('#inboxMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.todo.appSettings.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        let goals = await window.inboxAPI.getInbox()
        let breaks = this.todo.appSettings.date.get_inbox_sections(goals)
        let titles = ['Today', 'Last 7 days', 'Last 30 days', 'Later']

        for (let i = 0; i < goals.length; i++) {
            this.add_todo(goals[i], 1)
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
    add_todo(goal, way) {
        const template = $('#inboxTodoTemplate').prop('content');
        let id = $('.inboxTodo').length
        let $clone = $(template).clone()
        $clone.find('.inboxTodoId').text(goal['id']);
        $clone.find('.task').text(goal['name']);

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
    async new_goal() {
        let $inbox_input = $('#inboxInput')
        let name = $inbox_input.val()
        $inbox_input.val("")

        let new_goal = await window.inboxAPI.newInboxGoal({name: name, add_date: this.todo.appSettings.date.today_sql})
        this.add_todo(new_goal, 0)
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

        window.inboxAPI.checkInboxGoal({'id': selected_todo_id})

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