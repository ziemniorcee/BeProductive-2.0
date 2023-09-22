function init(){
    dragula([document.querySelector("#dragparent")]);
}
let tasks = []
function press() {
    tasks = []
    let elements = document.getElementsByClassName("task")
    goals_len = elements.length
    for (let i = 0; i < goals_len; i++) {
        tasks.push(elements[i].textContent)

    }

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

function change() {
    for(let i = 0; i < tasks.length; i++){
        tasks[i] = tasks[i].replace("'", "`@`")
    }
    window.electronAPI4.sendData({tasks: tasks})
}
