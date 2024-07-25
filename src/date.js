import {weekdays, month_names} from "./data.mjs";
import {reset_project_pos} from "./project.mjs";
import {close_edit} from "./edit.mjs";
import {dragula_week_view} from "./weekView.mjs";
import {dragula_month_view, month_view} from "./monthView.mjs";

class CurrentDate {
    constructor() {
        this.today = new Date()
        this.today_sql = this.sql_format(this.today)
        this.tomorrow = new Date(this.today.getTime())
        this.tomorrow.setDate(this.tomorrow.getDate() + 1)
        this.week_now = []

        this.set_attributes(this.today)
        this.week_current = this.week_now

        let _week_next = new Date()
        _week_next.setDate(this.today.getDate() + 7)
        this.week_next = this.set_week(_week_next)

        this.month_next = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1)

        this.month_current = this.set_current_month()
        this.glory_month = this.get_sql_month()
    }

    get_day_view_header() {
        if (this.day_sql === this.sql_format(this.today)) return 'My day'
        else if (this.day_sql === this.sql_format(this.tomorrow)) return 'Tomorrow'
        else return 'Another day'
    }

    set_week(date) {
        let current_dayweek = 6
        if (date.getDay() !== 0) current_dayweek = date.getDay() - 1

        let dates_array = []

        let week_start = new Date(date.getTime())
        week_start.setDate(week_start.getDate() - current_dayweek - 1)

        for (let i = 0; i < 7; i++) {
            week_start.setDate(week_start.getDate() + 1)
            dates_array.push(this.sql_format(week_start))
        }

        return dates_array;
    }

    get_week_day(day_index) {
        let date = new Date(this.week_now[day_index])
        this.set_attributes(date)
    }

    this_week() {
        this.set_attributes(this.today)
    }

    next_week() {
        let week_next = new Date()

        week_next.setDate(this.today.getDate() + 7)
        this.set_attributes(week_next)
    }

    get_header_week() {
        let main_title = ""
        if (this.week_current.includes(this.day_sql)) main_title = 'This Week'
        else if (this.week_next.includes(this.day_sql)) main_title = 'Next Week'
        else main_title = 'Another Week'

        let date_display = l_date.get_week_display_format(l_date.week_now)

        return [main_title, date_display]
    }

    get_format_month() {
        let date = new Date(this.day_sql)

        date.setDate(date.getDate() - date.getDate() + 1)

        let current_dayweek = 6
        if (date.getDay() !== 0) current_dayweek = date.getDay() - 1


        let lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return [current_dayweek, lastDate.getDate() + current_dayweek]
    }

    set_current_month() {
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        let last_history_date = new Date(date)
        last_history_date.setDate(last_history_date.getDate() - 1)
        return this.sql_format(last_history_date)
    }

    get_sql_month() {
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        let last_history_date = new Date(date)
        last_history_date.setDate(last_history_date.getDate() - 1)

        let lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        return [this.sql_format(date), this.sql_format(lastDate)]
    }

    get_sql_month_day(day) {
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        date.setDate(date.getDate() + day - 1)

        return this.sql_format(date)
    }

    set_sql_month(day) {
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)

        date.setDate(date.getDate() + day - 1)

        this.set_attributes(date)
    }

    this_month() {
        this.set_attributes(this.today)
    }

    next_month() {
        this.set_attributes(this.month_next)
    }

    get_fixed_header_month() {
        let date = new Date(this.day_sql)

        let header = "Another Month"
        if (date.getMonth() === this.today.getMonth()) header = "This Month"
        else if (date.getMonth() === this.month_next.getMonth()) header = "Next Month"

        return header
    }

    glory_prev_month() {
        let last_date = new Date(this.glory_month[0])
        last_date.setDate(last_date.getDate() - 1)
        let date = new Date(last_date)
        date.setDate(date.getDate() - date.getDate() + 1)

        this.glory_month = [this.sql_format(date), this.sql_format(last_date)]
    }

    glory_next_month() {
        let date = new Date(this.glory_month[1])
        date.setDate(date.getDate() + 1)

        let last_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        this.glory_month = [this.sql_format(date), this.sql_format(last_date)]
    }

    get_glory_month() {
        let date = new Date(this.glory_month[0])
        return date.getMonth()
    }

    get_repeat_dates(option) {
        let dates = [l_date.day_sql]
        if (option === 0) dates = l_date.get_every(1, 30)
        else if (option === 1) dates = l_date.get_every(7, 12)
        else if (option === 2) dates = l_date.get_everymonth()
        return dates
    }

    get_every(how_often, how_many) {
        let date = new Date(this.day_sql)

        let dates = []
        for (let i = 0; i < how_many; i++) {
            dates.push(this.sql_format(date))
            date.setDate(date.getDate() + how_often)
        }
        return dates
    }

    get_everymonth() {
        let date = new Date(this.day_sql)
        let first_day = date.getDate()
        let dates = []
        for (let i = 0; i < 6; i++) {
            dates.push(this.sql_format(date))
            let last_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            let next_month = new Date(date.getFullYear(), date.getMonth() + 2, 0)

            if (first_day > next_month.getDate()) {
                date.setDate(date.getDate() + next_month.getDate())
            } else {
                date = new Date(last_date)
                date.setDate(date.getDate() + first_day)
            }
        }
        return dates
    }

    is_today_monthview() {
        let date = new Date(this.day_sql)
        if (date.getFullYear() === this.today.getFullYear() && date.getMonth() === this.today.getMonth()) {
            return this.today.getDate()
        }
        return 0
    }

    set_attributes(date) {
        this.day_sql = this.sql_format(date)
        this.week_now = this.set_week(date)
    }

    sql_format(date) {
        let format_day = date.getDate()
        let format_month = date.getMonth() + 1

        if (format_month < 10) format_month = "0" + format_month
        if (format_day < 10) format_day = "0" + format_day

        return `${date.getFullYear()}-${format_month}-${format_day}`;
    }

    get_display_format(date_sql) {
        let date = new Date(date_sql)
        let format_day = date.getDate()
        if (format_day < 10) format_day = "0" + format_day

        return `${weekdays[date.getDay()]}, ${month_names[date.getMonth()]} ${format_day}, ${date.getFullYear()}`
    }

    get_week_display_format(week) {
        let beginning = new Date(week[0])
        let format_day_beginning = beginning.getDate()
        if (format_day_beginning < 10) format_day_beginning = "0" + format_day_beginning

        let ending = new Date(week[6])
        let format_day_ending = ending.getDate()
        if (format_day_ending < 10) format_day_ending = "0" + format_day_ending

        return `${month_names[beginning.getMonth()]} ${format_day_beginning} -
        ${month_names[ending.getMonth()]} ${format_day_ending}`
    }

    get_month_display_format(date_sql) {
        let date = new Date(date_sql)
        return `${month_names[date.getMonth()]} ${date.getFullYear()}`
    }

    get_current_dates(selected_button = null) {
        let button_id = $(selected_button).attr('id')
        if ($('#todosAll').length) return [this.day_sql]
        else if ($('.weekDay').length || button_id === "dashWeek") return this.week_now
        else if ($('#monthGrid').length) return this.get_month_array()
    }

    get_month_array() {
        let dates = this.get_sql_month()
        let range = this.get_format_month()
        let base = dates[0].substring(0, 8)

        let month_array = []
        for (let i = 1; i <= range[1]; i++) {
            if (i < 10) month_array.push(base + "0" + i)
            else month_array.push(base + i)
        }

        return month_array
    }
}

export let l_date = new CurrentDate()


function date_change(option) {
    if (option === 0) this.set_attributes(this.today)
    else if (option === 1) this.set_attributes(this.tomorrow)

    $('.todo').remove()

    window.goalsAPI.askGoals({date: l_date.day_sql})
}

function week_change(option) {
    if (option === 0) l_date.this_week()
    else if (option === 1) l_date.next_week()

    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
}

function month_change(option) {
    if (option === 0) l_date.this_month()
    else if (option === 1) l_date.next_month()

    month_view()
}


$("#datePicker").datepicker({
    onSelect: function () {
        reset_project_pos()

        l_date.set_attributes($(this).datepicker('getDate'))
        if ($('#todosAll').length) {
            date_change(2)
            $('#mainTitle').text(l_date.get_day_view_header())
        } else if ($('.weekDay').length) {
            week_change(2)
            let header_params = l_date.get_header_week()
            $('#mainTitle').text(header_params[0])
            $('#date').text(header_params[1])
        } else {
            month_change(2)
        }
        close_edit()
    }
});

