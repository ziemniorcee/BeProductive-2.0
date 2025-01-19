import {weekdays, month_names} from "./data.mjs";

export class CurrentDate {
    constructor() {
        this.initEventListeners()
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
        this.glory_month = this.get_sql_month(this.day_sql)
    }

    initEventListeners() {
        $("#datePicker").datepicker({
            onSelect: (event) => {
                this.set_attributes($(event.currentTarget).datepicker('getDate'))

                if ($('#todosAll').length) {
                    day_view()
                    $('#mainTitle').text(this.get_day_view_header())
                } else if ($('.weekDay').length) {
                    week_view()
                    let header_params = this.get_header_week()
                    $('#mainTitle').text(header_params[0])
                    $('#date').text(header_params[1])
                } else {
                    month_view()
                }
            }
        });

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

        let date_display = this.get_week_display_format(this.week_now)

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

    get_sql_month(selected_date) {
        let date = new Date(selected_date)
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

    sql_sql_month_day(day) {
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)

        date.setDate(date.getDate() + day - 1)

        return this.sql_format(date)
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
        let dates = [this.day_sql]
        if (option === 0) dates = this.get_every(1, 30)
        else if (option === 1) dates = this.get_every(7, 12)
        else if (option === 2) dates = this.get_everymonth()
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
        let dates = this.get_sql_month(this.day_sql)
        let range = this.get_format_month()
        let base = dates[0].substring(0, 8)

        let month_array = []
        console.log(range[1] - range[0])
        for (let i = 1; i <= range[1] - range[0]; i++) {
            if (i < 10) month_array.push(base + "0" + i)
            else month_array.push(base + i)
        }

        return month_array
    }

    get_history_day() {
        let selected_date = new Date(this.day_sql)
        let current_date = new Date(this.today_sql)

        if (selected_date < current_date) return this.day_sql
        else return this.today_sql
    }

    get_history_week() {
        let selected_date = new Date(this.week_now[0])
        let current_date = new Date(this.week_current[0])
        if (selected_date < current_date) return this.week_now[0]
        else return this.week_current[0]
    }

    get_history_month() {
        let selected_sql = this.get_sql_month(this.day_sql)[0]
        let selected_date = new Date(selected_sql)

        let current_sql = this.get_sql_month(this.today_sql)[0]
        let current_date = new Date(current_sql)

        if (selected_date < current_date) return selected_sql
        else return current_sql
    }

    get_next_date(direction) {
        if ($('#todosAll').length) {
            let selected_date = new Date(this.day_sql)
            selected_date.setDate(selected_date.getDate() + direction)
            this.set_attributes(selected_date)
        } else if ($('.weekDay').length) {
            let selected_date
            if (direction === -1) {
                selected_date = new Date(this.week_now[0])
            } else if (direction === 1) {
                selected_date = new Date(this.week_now[6])
            }
            selected_date.setDate(selected_date.getDate() + direction)
            this.set_attributes(selected_date)
        } else if ($('#monthGrid').length) {
            let month_array = this.get_month_array()
            let selected_date
            if (direction === -1) {
                selected_date = new Date(month_array[0])
            } else if (direction === 1) {
                selected_date = new Date(month_array[month_array.length - 1])
            }
            selected_date.setDate(selected_date.getDate() + direction)
            this.set_attributes(selected_date)
        }
    }

    get_inbox_sections(goals) {
        let today_yesterday = new Date()
        today_yesterday.setDate(this.today.getDate() - 1)

        let today_week_ago = new Date()
        today_week_ago.setDate(this.today.getDate() - 7)

        let today_month_ago = new Date()
        today_month_ago.setDate(this.today.getDate() - 30)

        let break_points = [-1, -1, -1, -1]
        let state_before = -1
        for (let i = 0; i < goals.length; i++) {
            let new_state = state_before
            let current_date = new Date(goals[i]['add_date'])

            if (current_date > today_yesterday) {
                new_state = 0
            } else if (current_date > today_week_ago) {
                new_state = 1
            } else if (current_date > today_month_ago) {
                new_state = 2
            } else {
                new_state = 3
            }

            if (state_before !== new_state) {
                break_points[new_state] = i
                state_before = new_state
            }

        }
        return break_points
    }

    get_edit_date_format(date){
        let format_day = date.getDate()
        let format_month = date.getMonth() + 1

        if (format_month < 10) format_month = "0" + format_month
        if (format_day < 10) format_day = "0" + format_day

        return `${format_day}.${format_month}.${date.getFullYear()}`;
    }

    change_to_edit_format(sql_format){
        let date = new Date(sql_format)
        return this.get_edit_date_format(date)
    }

    get_edit_sql_format(edit_format){
        const [day, month, year] = edit_format.split('.').map(Number); // Split and convert to numbers
        const date = new Date(year, month - 1, day);
        return this.sql_format(date)
    }
}



