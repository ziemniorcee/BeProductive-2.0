import {l_date} from "./date.js";
let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let images = ["images/goals/history.png", "images/goals/idea.png"]
let displays = ["", ""]
let current_sidebar = 0
let categories = ["History", "Ideas"]

window.electronAPI7.getData({date: l_date.sql}) // This calls the exposed method from the preload script
window.electronAPI7.receiveData((data) => {
    let date = data[0].addDate
    let goals = []

    for (let i = 0; i < data.length;i++){
        if(date!==data[i].addDate){
            load_history(goals, date)

            goals = []
            date = data[i].addDate
        }
        goals.push(data[i].goal)

    }
    load_history(goals, date)

    let elements = document.getElementsByClassName('history_add');

    for (let i =0; i < elements.length; i++){
        elements[i].addEventListener('click', (event)=>{
            let task_chosen = event.target.parentNode.childNodes[1].childNodes[0].innerText
            let tasks_before = event.target.parentNode.parentNode.children
            let tasks_left = []

            for(let i =0 ; i < tasks_before.length; i++){
                let task_text = tasks_before[i].children[1].innerText
                if(task_chosen !== task_text){
                    tasks_left.push(task_text)
                }
            }

            date = event.target.parentNode.parentNode.parentNode.children[0].innerText
            let d = new Date(date)
            let format_day = d.getDate()
            let format_month = d.getMonth() + 1


            if(format_day < 10){format_day = "0" + format_day}
            if(format_month < 10){format_month = "0" + format_month}
            let formated_date = d.getFullYear() +"-"+format_month+"-"+format_day

            if (event.target.parentNode.parentNode.children.length > 1){
                event.target.parentNode.remove()
            }
            else{
                event.target.parentNode.parentNode.parentNode.remove()
            }



            window.electronAPI8.sendTasks({tasks: tasks_left, date:formated_date})
            get_goal(event.target.parentNode.childNodes[1].childNodes[0].innerText)

        })

    }
})

function load_history(array, date){
    let d = new Date(date)
    let format_day = d.getDate()
    if(format_day < 10){format_day = "0" + format_day}

    let display = weekdays[d.getDay()]+", "+month_names[d.getMonth()]+" "+format_day+", "+d.getFullYear();

    let stringhtml = "<div class='day'><span class='history_date'>"+display+
        "</span><div class='tasks_history'>"


    for(let i = 0; i < array.length; i++){
        stringhtml += "<div class='task_history'><input type='checkbox' " +
            "class='check_history'><div><span>"+array[i].replace("`@`", "'")+"</span></div><span class='history_add'>+</span></div>"
    }
    document.getElementById("days").innerHTML += stringhtml
    displays[0] += stringhtml
}

const resizer = document.querySelector("#resizer");
const sidebar = document.querySelector("#rightbar");

resizer.addEventListener("mousedown", (event) => {
    document.addEventListener("mousemove", resize, false);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
    }, false);
});

function resize(e) {
    let width = document.getElementById('container').offsetWidth
    const size = `${ width - e.x}px`;
    sidebar.style.flexBasis = size;

}

let sidebar_state = true
sidebar.style.flexBasis = '500px';

const mainContent = document.querySelector("#main-content");
document.getElementById("img_main").addEventListener('click', ()=>{
    sidebar_state = !sidebar_state
    if(sidebar_state){
        sidebar.style.display = 'block'
        resizer.style.display = 'flex'
    }
    else{
        sidebar.style.display = 'none'
        resizer.style.display = 'none'
    }
})



document.getElementById("img_second").addEventListener('click', () =>{
    current_sidebar = ! current_sidebar

    console.log()
    document.getElementById("days").innerHTML = displays[Number(current_sidebar)]
    document.getElementById("head_text").innerText= categories[Number(current_sidebar)]


    document.getElementById("img_main").src=images[Number(current_sidebar)]
    document.getElementById("img_second").src=images[Number(!current_sidebar)]


})
function get_goal(text){
    window.electronAPI2.sendData({goal_text: text.replace("'", "`@`")})
    document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
        "<input type='checkbox'  class='check_task' ><div class='task_text'><span class='task'>" + text + "</span></div></div>"
}


$(document).on('click', '.check_history', function (event) {
    setTimeout(function(){
        if (event.target.parentNode.parentNode.children.length > 1){
            event.target.parentNode.remove()
        }
        else{
            event.target.parentNode.parentNode.parentNode.remove()
        }

        console.log(event.target.parentNode.children[1].innerText)
    }, 1000)

    let task_chosen = event.target.parentNode.childNodes[1].childNodes[0].innerText
    let tasks_before = event.target.parentNode.parentNode.children
    let tasks_left = []
    let id = 0
    for(let i =0 ; i < tasks_before.length; i++){
        let task_text = tasks_before[i].children[1].innerText
        if(task_chosen === task_text){
            id = i
            break
        }
    }


    let date = event.target.parentNode.parentNode.parentNode.children[0].innerText
    let d = new Date(date)
    let format_day = d.getDate()
    let format_month = d.getMonth() + 1


    if(format_day < 10){format_day = "0" + format_day}
    if(format_month < 10){format_month = "0" + format_month}
    let formated_date = d.getFullYear() +"-"+format_month+"-"+format_day

    window.electronAPI9.sendTasks({index: id, date:formated_date})
});