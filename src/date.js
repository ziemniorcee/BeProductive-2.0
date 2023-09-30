class CurrentDate{
    constructor() {
        this.d = new Date();
        this.d_today = this.d.getDate()
        this.weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        this.month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.set_attributes()
    }

    today(){
        this.d.setDate(this.d_today)
        this.set_attributes()
        document.getElementById("todayimg").src="images/goals/today1.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow0.png"
        document.getElementById("anotherdayimg").src="images/goals/other0.png"
    }
    tomorrow(){
        this.d.setDate(this.d_today + 1)
        this.set_attributes()

        document.getElementById("todayimg").src="images/goals/today0.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow1.png"
        document.getElementById("anotherdayimg").src="images/goals/other0.png"
    }

    set_attributes(){
        this.day = this.d.getDate()
        this.weekday = this.d.getDay()
        this.month = this.d.getMonth() + 1
        this.year = this.d.getFullYear()
        this.format_day = this.day
        this.format_month = this.month

        this.sql = this.sql_format()
        this.display = this.display_format()

    }
    sql_format(){
        this.format_day = this.day
        this.format_month = this.month

        if(this.month < 10){
            this.format_month = "0" + this.month
        }

        if(this.day < 10){
            this.format_day = "0" + this.day
        }
        return this.year + "-" + this.format_month + "-" + this.format_day;
    }

    display_format(){
        this.format_day = this.day
        if(this.day < 10){
            this.format_day = "0" + this.day
        }
        return this.weekdays[this.weekday]+", "+this.month_names[this.month-1]+" "+this.format_day+", "+this.year;
    }
}


export let l_date = new CurrentDate()
let date = l_date


function date_change(option){
    if(option === 0){
        l_date.today()
    }
    else if(option === 1){
        l_date.tomorrow()
    }

    if(date !== l_date.sql){
        date = l_date.sql
        document.getElementById("date").innerHTML = l_date.display

        let elements = document.getElementsByClassName("dragthing")
        let length = elements.length

        while(elements.length > 0){
            elements[0].remove()
        }
        window.electronAPI.getData({date: date})
    }
}

document.getElementById("todayBtn").addEventListener('click', ()=>{
    date_change(0)
})
document.getElementById("tomorrowBtn").addEventListener('click', ()=>{
    date_change(1)
})
document.getElementById("otherDateBtn").addEventListener('click', ()=>{
    $(function(){
        $("#otherDateBtn").datepicker();
    })
})

$("#datepicker").datepicker({
    onSelect: function() {
        let dateObject = $(this).datepicker('getDate');
        l_date.d.setFullYear(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate())
        l_date.set_attributes()
        date_change(2)

        document.getElementById("todayimg").src="images/goals/today0.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow0.png"
        document.getElementById("anotherdayimg").src="images/goals/other1.png"
    }
});

