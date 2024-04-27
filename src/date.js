import {weekdays, month_names} from "./data.mjs";

class CurrentDate {
    constructor() {
        this.today = new Date()
        this.today_sql = this.sql_format(this.today)
        this.tomorrow = new Date(this.today.getTime())
        this.tomorrow.setDate(this.tomorrow.getDate() + 1)
        this.week_now = []

        this.set_attributes(this.today, 0)
        this.week_current = this.week_now

        let _week_next = new Date()
        _week_next.setDate(this.today.getDate() + 7)
        this.week_next = this.set_week(_week_next)

        this.month_next = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1)

        this.month_current = this.set_current_month()
        this.glory_month = this.get_sql_month()
    }

    get_today() {
        this.set_attributes(this.today, 0)
    }

    get_tomorrow() {
        this.set_attributes(this.tomorrow, 1)
    }

    fix_header_day() {
        if (this.day_sql === this.sql_format(this.today)) this.change_images(0)
        else if (this.day_sql === this.sql_format(this.tomorrow)) this.change_images(1)
        else this.change_images(2)
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

    this_week() {
        this.set_attributes(this.today, 0)
    }

    next_week() {
        let week_next = new Date()

        week_next.setDate(this.today.getDate() + 7)
        this.set_attributes(week_next, 1)
    }

    fix_header_week() {
        if (this.week_current.includes(this.day_sql)) this.change_images(0)
        else if (this.week_next.includes(this.day_sql)) this.change_images(1)
        else this.change_images(2)
    }

    get_format_month(){
        let date = new Date(this.day_sql)

        date.setDate(date.getDate() - date.getDate() + 1)

        let current_dayweek = 6
        if (date.getDay() !== 0) current_dayweek = date.getDay() - 1


        let lastDate = new Date(date.getFullYear(), date.getMonth()+1, 0)
        return [current_dayweek, lastDate.getDate() + current_dayweek]
    }

    set_current_month(){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        let last_history_date = new Date(date)
        last_history_date.setDate(last_history_date.getDate() -1)
        return this.sql_format(last_history_date)
    }

    get_sql_month(){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        let last_history_date = new Date(date)
        last_history_date.setDate(last_history_date.getDate() -1)

        let lastDate = new Date(date.getFullYear(), date.getMonth()+1, 0)

        return [this.sql_format(date), this.sql_format(lastDate)]
    }

    get_sql_month_day(day){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)
        date.setDate(date.getDate() + day - 1)

        this.fix_header_month()
        return this.sql_format(date)
    }

    set_sql_month(day){
        let date = new Date(this.day_sql)
        date.setDate(date.getDate() - date.getDate() + 1)

        date.setDate(date.getDate() + day - 1)

        this.set_attributes(date, 2)
    }

    this_month(){
        this.set_attributes(this.today, 0)
    }

    next_month(){
        this.set_attributes(this.month_next, 1)
    }

    fix_header_month() {
        let date = new Date(this.day_sql)

        if (date.getMonth() === this.today.getMonth()) this.change_images(0)
        else if (date.getMonth() === this.month_next.getMonth()) this.change_images(1)
        else this.change_images(2)
    }

    glory_prev_month(){
        let last_date = new Date(this.glory_month[0])
        last_date.setDate(last_date.getDate() - 1)
        let date = new Date(last_date)
        date.setDate(date.getDate() - date.getDate() + 1)

        this.glory_month = [this.sql_format(date), this.sql_format(last_date)]
    }

    glory_next_month(){
        let date = new Date(this.glory_month[1])
        date.setDate(date.getDate() + 1)

        let last_date = new Date(date.getFullYear(), date.getMonth()+1, 0)
        this.glory_month = [this.sql_format(date), this.sql_format(last_date)]
    }

    get_glory_month(){
        let date = new Date(this.glory_month[0])
        return date.getMonth()
    }

    get_every(how_often, how_many){
        let date = new Date(this.day_sql)

        let dates = []
        for (let i = 0; i < how_many; i++){
            dates.push(this.sql_format(date))
            date.setDate(date.getDate() + how_often)
        }
        return dates
    }

    get_everymonth(){

        let date = new Date(this.day_sql)
        let first_day = date.getDate()
        let dates = []
        for (let i = 0; i < 6; i++){
            dates.push(this.sql_format(date))
            let last_date = new Date(date.getFullYear(), date.getMonth()+1, 0)
            let next_month = new Date(date.getFullYear(), date.getMonth()+2, 0)

            if (first_day > next_month.getDate()){
                date.setDate(date.getDate() + next_month.getDate())
            }
            else{
                date = new Date(last_date)
                date.setDate(date.getDate() + first_day)
            }


        }
        return dates
    }

    is_today_monthview(){
        let date = new Date(this.day_sql)
        if (date.getFullYear() === this.today.getFullYear() && date.getMonth() === this.today.getMonth()){
            return this.today.getDate()
        }
        return 0
    }
    set_attributes(date, option) {
        this.display_format(date)
        this.day_sql = this.sql_format(date)
        this.week_now = this.set_week(date)

        this.change_images(option)
    }

    change_images(option) {
        let date_button = $(".dateButton")
        date_button.css("border-color", "black")
        date_button.eq(option).css("border-color", "#FFC90E")

        $('#todayImg').attr('src', `images/goals/today${option === 0 ? "1" : "0"}.png`)
        $('#tomorrowImg').attr('src', `images/goals/tomorrow${option === 1 ? "1" : "0"}.png`)
        $('#otherImg').attr('src', `images/goals/other${option === 2 ? "1" : "0"}.png`)
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

function month_change(option){
    if (option === 0) l_date.this_month()
    else if (option === 1) l_date.next_month()

    window.goalsAPI.askMonthGoals({dates: l_date.get_sql_month(), goal_check: 0})
}

$(document).on('click', '#todayButton', () => {
    if ($('#todosAll').length) date_change(0)
    else if ($('.weekDay').length) week_change(0)
    else month_change(0)
})

$(document).on('click', '#tomorrowButton', () => {
    if ($('#todosAll').length) date_change(1)
    else if ($('.weekDay').length) week_change(1)
    else month_change(1)
})

$(document).on('click', '#otherButton', () => {
    $(function () {
        $("#otherDateBtn").datepicker();
    })
})


$("#datePicker").datepicker({
    onSelect: function () {
        $(".dateButton").css("border-color", "black")
        $("#otherButton").css("border-color", "#FFC90E")
        l_date.set_attributes($(this).datepicker('getDate'), 2)
        if ($('#todosAll').length) date_change(2)
        else if ($('.weekDay').length) week_change(2)
        else month_change(2)
    }
});

