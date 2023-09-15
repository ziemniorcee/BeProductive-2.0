let goals_len = 0;
let data = {};
let pressed = false

const d = new Date();
month = d.getMonth() + 1
if (month < 10){
    date = d.getFullYear() + "-0" + month + "-" + d.getDate();
}
else{
    date = d.getFullYear() + "-" + month + "-" + d.getDate();
}

let todo_length = 0


window.electronAPI.getData({date: date}) // This calls the exposed method from the preload script
window.electronAPI.receiveData((data) => {
    todo_length = data.length
    let nameString = data.map((elem) => {
        return new_goal(elem.goal)
    })
})


function new_goal(text="") {
    let goal_text = ""
    if (text === ""){

        goal_text = document.getElementById('entry').value
        window.electronAPI2.sendData({goal_text: goal_text, date: date})
    }
    else{
        goal_text = text
    }

    if(goal_text !== ""){
        document.getElementById("dragparent").innerHTML += "<div class='dragthing' onmousedown='press()' onmouseup='unpress()'>" +
            "<input type='checkbox' class='check_task' ><label class='task'>"+goal_text+"</label></div>"
        document.getElementById('entry').value = ""
    }
}

window.addEventListener("DOMContentLoaded", (event) =>{
    const el = document.getElementById('dragparent');
    if (el){
        el.addEventListener('contextmenu', function handleClick(event){
            if (event.target.classList.contains("dragthing")){
                console.log("XDXDXD")
                event.target.remove()
                pressed = true
            }

        })
    }
})
function press(){
    let elements = document.getElementsByClassName("task")
    goals_len = elements.length
}
function unpress(){
    let elements = document.getElementsByClassName("task")
    console.log("----------")
    for(let i  = 0; i < goals_len; i++){
        console.log(elements[i].textContent)
        data.goals = elements[i].textContent
    }

}

window.oncontextmenu = function() {
    console.log(pressed)
    try{
        console.log("Right-click detected.");
        return pressed;
    } finally {
        pressed = false
    }

}