class CurrentDate{
    constructor() {
        this.today = new Date();
        this.now = new Date(this.today)

        this.set_attributes()
    }

    get_today(){
        this.today.setDate(this.now.getDate()) // bad solution
        this.today.setDate(this.now.getDate())
        this.today.setMonth(this.now.getMonth())

        this.set_attributes()
        document.getElementById("todayimg").src="images/goals/today1.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow0.png"
        document.getElementById("anotherdayimg").src="images/goals/other0.png"
    }
    tomorrow(){
        this.today.setMonth(this.now.getMonth())
        this.today.setDate(this.now.getDate() + 1)

        this.set_attributes()
        document.getElementById("todayimg").src="images/goals/today0.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow1.png"
        document.getElementById("anotherdayimg").src="images/goals/other0.png"
    }

    set_attributes(){
        this.sql = this.sql_format()
        this.display = this.display_format()
    }
    sql_format(){
        let format_day = this.today.getDate()
        let format_month = this.today.getMonth() + 1

        if(format_month < 10){format_month = "0" + format_month}
        if(format_day < 10){format_day = "0" + format_day}

        return this.today.getFullYear() + "-" + format_month + "-" + format_day;
    }

    display_format(){
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let format_day = this.today.getDate()
        if(format_day < 10){format_day = "0" + format_day}
        return weekdays[this.today.getDay()]+", "+month_names[this.today.getMonth()]+" "+format_day+", "+this.today.getFullYear();
    }
}


export let l_date = new CurrentDate()
let date = l_date


function date_change(option){
    if(option === 0){
        l_date.get_today()
    }
    else if(option === 1){
        l_date.tomorrow()
    }

    if(date !== l_date.sql){
        date = l_date.sql
        document.getElementById("date").innerHTML = l_date.display

        let elements = document.getElementsByClassName("todo")
        let length = elements.length

        while(elements.length > 0){
            elements[0].remove()
        }
        window.goalsAPI.askGoals({date: date})
    }
}

document.getElementById("todayBtn").addEventListener('click', ()=>date_change(0))
document.getElementById("tomorrowBtn").addEventListener('click', ()=>date_change(1))
document.getElementById("otherDateBtn").addEventListener('click', ()=>{
    $(function(){
        $("#otherDateBtn").datepicker();
    })
})

$("#datepicker").datepicker({
    onSelect: function() {
        let dateObject = $(this).datepicker('getDate');
        l_date.today.setFullYear(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate())
        l_date.set_attributes()
        date_change(2)

        document.getElementById("todayimg").src="images/goals/today0.png"
        document.getElementById("tomorrowimg").src="images/goals/tomorrow0.png"
        document.getElementById("anotherdayimg").src="images/goals/other1.png"
    }
});

