import {DayView} from "./dayView.js";
import {WeekView} from "./weekView.mjs";
import {MonthView} from "./monthView.mjs";

export class PlanViews {
    constructor(todo) {
        this.todo = todo

        this.dayView = new DayView(todo)
        this.weekView = new WeekView(todo)
        this.monthView = new MonthView(todo)

        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '#goLeft', async () => {
            await this.change_date(-1)
        })

        $(document).on('click', '#goRight', async () => {
            await this.change_date(1)
        })

        $("#datePicker").datepicker({
            onSelect: async (dateText, inst) => {
                const $input = inst.input;
                const selectedDate = $input.datepicker('getDate');
                this.app.date.set_attributes(selectedDate)

                if ($('#todosAll').length) {
                    await this.app.dayView.display()
                    $('#mainTitle').text(this.app.date.get_day_view_header())
                } else if ($('.weekDay').length) {
                    await this.app.weekView.display()
                    let header_params = this.app.date.get_header_week()
                    $('#mainTitle').text(header_params[0])
                    $('#date').text(header_params[1])
                } else {
                    await this.app.monthView.display()
                }
            }
        });

        $(document).on('click', '.projectType', async (event) => {
            await this.todo.project.show_project_sidebar(event.currentTarget)
        });


    }

    async change_date(direction) {
        this.todo.appSettings.date.get_next_date(direction)
        if($('#todosAll').length) await this.dayView.display()
        else if ($('.weekDay').length) await this.weekView.display()
        else if ($('#monthGrid').length) await this.monthView.display()
    }
}
