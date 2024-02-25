import {weekdays, month_names} from "./data.mjs";

class CurrentDate {
    constructor() {
        this.today = new Date()
        this.tomorrow = new Date(this.today.getTime())
        this.tomorrow.setDate(this.tomorrow.getDate() + 1)

        this.week_now = []

        this.set_attributes(this.today, 0)
        this.week_current = this.week_now

        let _week_next = new Date()
        _week_next.setDate(this.today.getDate() + 7)
        this.week_next = this.set_week(_week_next)
    }

    get_today() {
        this.set_attributes(this.today, 0)
    }

    get_tomorrow() {
        this.set_attributes(this.tomorrow, 1)
    }

    this_week() {
        this.set_attributes(this.today, 0)
    }

    next_week() {
        let week_next = new Date()

        week_next.setDate(this.today.getDate() + 7)
        this.set_attributes(week_next, 1)
    }

    set_attributes(date, option) {
        this.display_format(date)
        this.day_sql = this.sql_format(date)
        this.week_now = this.set_week(date)

        this.change_images(option)
    }

    change_images(option) {
        $('#todayImg').attr('src', `images/goals/today${option === 0 ? "1" : "0"}.png`)
        $('#tomorrowImg').attr('src', `images/goals/tomorrow${option === 1 ? "1" : "0"}.png`)
        $('#otherImg').attr('src', `images/goals/other${option === 2 ? "1" : "0"}.png`)
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
        this.set_attributes(date, 2)
    }

    fix_header_day() {
        if (this.day_sql === this.sql_format(this.today)) this.change_images(0)
        else if (this.day_sql === this.sql_format(this.tomorrow)) this.change_images(1)
        else this.change_images(2)
    }

    fix_header_week() {
        if (this.week_current.includes(this.day_sql)) this.change_images(0)
        else if (this.week_next.includes(this.day_sql)) this.change_images(1)
        else this.change_images(2)
    }

    sql_format(date) {
        let format_day = date.getDate()
        let format_month = date.getMonth() + 1

        if (format_month < 10) format_month = "0" + format_month
        if (format_day < 10) format_day = "0" + format_day

        return `${date.getFullYear()}-${format_month}-${format_day}`;
    }

    display_format(date) {
        let format_day = date.getDate()
        if (format_day < 10) format_day = "0" + format_day

        $('#date').html(`${weekdays[date.getDay()]}, ${month_names[date.getMonth()]} ${format_day}, ${date.getFullYear()}`)
    }

    get_format_month(){
        let date = new Date(this.day_sql)

        date.setDate(date.getDate() - date.getDate() + 1)

        let current_dayweek = 6
        if (date.getDay() !== 0) current_dayweek = date.getDay() - 1


        let lastDate = new Date(date.getFullYear(), date.getMonth()+1, 0)
        return [current_dayweek, lastDate.getDate() + current_dayweek]
    }

    get_sql_month(){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)

        let lastDate = new Date(date.getFullYear(), date.getMonth()+1, 0)

        return [this.sql_format(date), this.sql_format(lastDate)]
    }

    get_sql_month_day(day){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)

        date.setDate(date.getDate() + day - 1)

        return this.sql_format(date)
    }
}

export let l_date = new CurrentDate()

function date_change(option) {
    if (option === 0) l_date.get_today()
    else if (option === 1) l_date.get_tomorrow()

    $('.todo').remove()

    window.goalsAPI.askGoals({date: l_date.day_sql})
}

function week_change(option) {
    if (option === 0) l_date.this_week()
    else if (option === 1) l_date.next_week()

    window.goalsAPI.askWeekGoals({dates: l_date.week_now})
}

$(document).on('click', '#todayButton', () => {
    if ($('#todosAll').length) date_change(0)
    else week_change(0)
})

$(document).on('click', '#tomorrowButton', () => {
    if ($('#todosAll').length) date_change(1)
    else week_change(1)
})

$(document).on('click', '#otherButton', () => {
    $(function () {
        $("#otherDateBtn").datepicker();
    })
})


$("#datePicker").datepicker({
    onSelect: function () {
        l_date.set_attributes($(this).datepicker('getDate'), 2)
        if ($('#todosAll').length) date_change(2)
        else week_change(2)
    }
});

