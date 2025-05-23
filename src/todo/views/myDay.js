export class MyDayView {
    constructor(todo) {
        this.todo = todo
        this.templates = new MyDayViewTemplates(todo)
        this.bindEvents()
    }

    bindEvents() {
        $(document).on('click', '#MyDayList .check_task', (event) => {
            event.stopPropagation()
            let $todo = $(event.currentTarget).closest('.todo')
            let todo_id = $todo.find('.todoId').text()
            $todo.remove()
            window.goalsAPI.changeChecksGoal({id: todo_id, state: 1})
        })

        $(document).on('click', '#MyDayList .stepCheck', (event) => {
            event.stopPropagation()
            this.todo.todoComponents.steps.change_step_check(event.currentTarget)
        })


    }

    async display() {
        $('#main').html(this.templates.view())

        let goals = await window.goalsAPI.getMyDay({date: this.todo.appSettings.date.today_sql})
        console.log(goals)
        const rank = { 2: 0, 1: 1, 0: 2, 3: 3 };

        goals.sort((a, b) => {
            if (a.date_type === 2 && b.date_type !== 2) return -1;
            if (b.date_type === 2 && a.date_type !== 2) return  1;

            if (a.date_type === 3 && b.date_type !== 3) return  1;
            if (b.date_type === 3 && a.date_type !== 3) return -1;

            if (a.importance !== b.importance) {
                return b.importance - a.importance;
            }

            return b.date_type - a.date_type;
        });


        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.todo.todoComponents.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = this.todo.appSettings.data.decode_text(goals[i]['goal'])
            $('#MyDayList').append(this.templates.goal(goals[i]))
        }
    }


}

class MyDayViewTemplates {
    constructor(todo) {
        this.todo = todo
    }

    view() {
        return `
            <div id="MyDayHeader">My Day</div>
            <div id="MyDayBody">
                <div id="MyDayList">
                    
                </div> 
                <div id="MyDayFooter">
                    <div id="MyDaySetup">
                        Setup
                    </div>
                </div>
                
            </div>`
    }

    goal(goal) {
        let category_color = "rgb(74, 74, 74)"
        let category_border = ""
        let date_label = ""
        let deadline_label = ""

        if (goal.category !== 0) {
            category_color = this.todo.appSettings.data.categories.categories[goal.category][0]
            category_border = `border-right: 4px solid ${category_color}`
        }

        let check_color = this.todo.appSettings.data.check_border[goal.importance]
        let fire_emblem = ""

        if(goal.date_type === 0){
            date_label = `<img src="images/goals/dateWarning.png" class="todoDeadline">`
        }
        else if(goal.date_type === 1){
            deadline_label = `<img src="images/goals/hourglass.png" class="todoDeadline">`
        }
        else if (goal.date_type === 2) {
            check_color = this.todo.appSettings.data.check_border[4]
            fire_emblem = `<img src="images/goals/fire1.png" class="ASAPLabel" alt="">`
        }

        let project_emblem = this.todo.appSettings.data.projects.project_emblem_html(goal.pr_id)

        return `
        <div class='todo' style="${category_border}">
            <div class="todoId">${goal.id}</div>
            <div class='todoCheck'>
                <input type='checkbox' class='check_task' style="border-color:${check_color}; color:${check_color}">
            </div>
            <div class='taskText'>
                <span class='task'> 
                    ${goal.goal}
                    ${fire_emblem}
                    ${deadline_label}
                    ${date_label}
                 </span>
                ${goal.steps}
            </div>
            ${project_emblem}
        </div>`
    }
}