import {weekdays} from "./data.mjs";

class CurrentDate {
    constructor() {
        this.today = new Date();
        this.now = new Date(this.today)
        this.week_start = new Date()
        this.week_end = new Date()
        this.week_day = new Date()

        this.set_attributes()
    }

    get_today() {
        this.today.setDate(this.now.getDate()) // bad solution
        this.today.setDate(this.now.getDate())
        this.today.setMonth(this.now.getMonth())


        this.set_attributes()
        document.getElementById("todayImg").src = "images/goals/today1.png"
        document.getElementById("tomorrowImg").src = "images/goals/tomorrow0.png"
        document.getElementById("otherImg").src = "images/goals/other0.png"
    }

    tomorrow() {
        this.today.setMonth(this.now.getMonth())
        this.today.setDate(this.now.getDate() + 1)

        this.set_attributes()
        document.getElementById("todayImg").src = "images/goals/today0.png"
        document.getElementById("tomorrowImg").src = "images/goals/tomorrow1.png"
        document.getElementById("otherImg").src = "images/goals/other0.png"
    }

    set_attributes() {
        let current_dayweek = 6
        if (this.today.getDay() !== 0) current_dayweek = this.today.getDay() - 1

        this.week_start.setDate(this.today.getDate() - current_dayweek)
        this.week_end.setDate(this.week_start.getDate() + 6)


        this.day_sql = this.sql_format(this.today)
        this.week_start_sql = this.sql_format(this.week_start)
        this.week_end_sql = this.sql_format(this.week_end)
        this.display = this.display_format()
    }

    sql_format(date) {
        let format_day = date.getDate()
        let format_month = date.getMonth() + 1

        if (format_month < 10) format_month = "0" + format_month
        if (format_day < 10) format_day = "0" + format_day

        return date.getFullYear() + "-" + format_month + "-" + format_day;
    }

    weekday_sql(day_id) {
        this.week_day.setDate(this.week_start.getDate() + day_id)
        return this.sql_format(this.week_day)
    }

    display_format() {
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let format_day = this.today.getDate()
        if (format_day < 10) {
            format_day = "0" + format_day
        }
        return weekdays[this.today.getDay()] + ", " + month_names[this.today.getMonth()] + " " + format_day + ", " + this.today.getFullYear();
    }
}


export let l_date = new CurrentDate()
let date = l_date


function date_change(option) {
    if (option === 0) {
        l_date.get_today()
    } else if (option === 1) {
        l_date.tomorrow()
    }

    if (date !== l_date.day_sql) {
        date = l_date.day_sql
        document.getElementById("date").innerHTML = l_date.display

        let elements = document.getElementsByClassName("todo")

        while (elements.length > 0) {
            elements[0].remove()
        }
        window.goalsAPI.askGoals({date: date})
    }
}

document.getElementById("todayButton").addEventListener('click', () => date_change(0))
document.getElementById("tomorrowButton").addEventListener('click', () => date_change(1))
document.getElementById("otherButton").addEventListener('click', () => {
    $(function () {
        $("#otherDateBtn").datepicker();
    })
})

$("#datePicker").datepicker({
    onSelect: function () {
        let dateObject = $(this).datepicker('getDate');
        l_date.today.setFullYear(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate())
        l_date.set_attributes()
        date_change(2)

        document.getElementById("todayImg").src = "images/goals/today0.png"
        document.getElementById("tomorrowImg").src = "images/goals/tomorrow0.png"
        document.getElementById("otherImg").src = "images/goals/other1.png"
    }
});

