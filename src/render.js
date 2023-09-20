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
    }
    tomorrow(){
        this.d.setDate(this.d_today + 1)
        this.set_attributes()

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

let goals_len = 0;
let data = {};
let pressed = false
let selected_div = null
let tasks = []

let l_date = new CurrentDate()

let date = l_date.sql


let todo_length = 0


window.electronAPI.getData({date: date}) // This calls the exposed method from the preload script
window.electronAPI.receiveData((data) => {
    todo_length = data.length
    let nameString = data.map((elem) => {
        return new_goal(elem.goal)
    })
})
window.electronAPI3.delete_task((event) => {
    selected_div.remove()
    let elements = document.getElementsByClassName("task")
    let before = tasks
    let index_del = elements.length

    tasks = []
    for (let i = 0; i < elements.length; i++) {
        tasks.push(elements[i].textContent)
        if (before[i] !== tasks[i]) {

            index_del = i
            break
        }
    }

    window.electronAPI5.sendId({del_id: index_del, date: date})
})


function new_goal(text = "") {
    let goal_text = ""
    if (text === "") {

        goal_text = document.getElementById('entry').value
        window.electronAPI2.sendData({goal_text: goal_text, date: date})
    } else {
        goal_text = text
    }

    if (goal_text !== "") {

        document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox' class='check_task' ><label class='task'>" + goal_text + "</label></div>"
        document.getElementById('entry').value = ""
        tasks.push(goal_text)
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    // date = d.getFullYear() + "-" + month + "-" + d.getDate();
    document.getElementById("date").innerHTML = l_date.display
    const el = document.getElementById('dragparent');
    if (el) {
        el.addEventListener('contextmenu', function handleClick(event) {
            if (event.target.classList.contains("dragthing")) {
                // window.electronAPI5.sendData({sendId: goal_text, date: date})
                selected_div = event.target
                pressed = true
            }

        })
    }
})

function press() {
    let elements = document.getElementsByClassName("task")
    goals_len = elements.length
}

function unpress() {
    let elements = document.getElementsByClassName("task")
    let before = tasks
    tasks = []
    for (let i = 0; i < goals_len; i++) {
        tasks.push(elements[i].textContent)
    }
    if (JSON.stringify(before) !== JSON.stringify(tasks)) {
        change()
    }

}

window.oncontextmenu = function () {
    try {
        return pressed;
    } finally {
        pressed = false
    }
}

function change() {
    window.electronAPI4.sendData({tasks: tasks, date: date})
}

function date_change(option){
    console.log("JP@")
    if(option === 0){
        l_date.today()
    }
    else if(option === 1){
        l_date.tomorrow()
    }
    else{
        HTMLInputElement.showPicker()
    }
    if(date !== l_date.sql){
        date = l_date.sql
        document.getElementById("date").innerHTML = l_date.display

        let elements = document.getElementsByClassName("dragthing")
        let length = elements.length
        console.log("----------")
        console.log(elements.length)
        console.log("----------")
        for(let i = 0; i < length; i++){
            console.log(i, elements.length)
            console.log("EXECUTE")
            elements[0].remove()
        }


        window.electronAPI.getData({date: date})
        window.electronAPI.receiveData((data) => {
            todo_length = data.length

            let goals_texts = data.map(({goal})=>goal)
            console.log(goals_texts)
            })


    }



}
