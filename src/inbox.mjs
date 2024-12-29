import {_hide_sidebar} from "./sidebar.mjs";

export class Inbox {
    constructor(app_date) {
        this.date = app_date
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
    }

    async build_view() {
        const main_template = $('#inboxMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        _hide_sidebar()
        $('#main').html($main_clone)

        let goals = await window.inboxAPI.getInbox()

        let breaks = this.date.get_inbox_sections(goals)
        console.log(breaks)
        let titles = ['Today', 'Last 7 days', 'Last 30 days', 'Later']
        let current_break = 0
        for (let i = 0; i < goals.length; i++) {
            if (breaks[current_break] === i) {
                $('#inboxList').append(`<div class="inboxListBreak">${titles[current_break]}</div>`)
                for (let j = current_break; j < breaks.length; j++) {
                    current_break += 1
                    if (breaks[current_break] !== -1) {
                        break
                    }
                }
            }
            this.add_todo(goals[i]["name"], 1)
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
            if ($first_break.text() === "Today"){
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






