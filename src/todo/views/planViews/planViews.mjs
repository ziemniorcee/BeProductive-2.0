import {DayView} from "./dayView.js";
import {WeekView} from "./weekView.mjs";
import {MonthView} from "./monthView.mjs";

export class PlanViews {
    constructor(app) {
        this.app = app

        this.dayView = new DayView(this.app)
        this.weekView = new WeekView(this.app)
        this.monthView = new MonthView(this.app)

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


                // } else if ($('.weekDay').length) {
                //     let header_params = this.app.date.get_header_week()
                //     $('#mainTitle').text(header_params[0])
                //     $('#date').text(header_params[1])
                // } else {
                //     await this.app.monthView.display()
                // }
            }
        });

        $(document).on('click', '.projectType', async (event) => {
            await this.app.settings.data.project.show_project_sidebar(event.currentTarget)
        });

        $(document).on('click', '#date', (event) => {
            event.stopPropagation()
            if ($('#planDateSelector').css('display') === 'none') {
                $('#planDateSelector').css('display', 'flex')
            } else {
                $('#planDateSelector').css('display', 'none')
            }
        })

    }

    async change_date(direction) {
        this.app.settings.date.get_next_date(direction)
        if($('#todosAll').length) await this.dayView.display()
        else if ($('.weekDay').length) await this.weekView.display()
        else if ($('#monthGrid').length) await this.monthView.display()
    }
}
