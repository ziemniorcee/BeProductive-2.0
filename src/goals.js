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

    let elements = document.getElementsByClassName("check_task")
    let array = []
    for (let i = 0; i < elements.length-1; i++) {
        array.push(Number(elements[i].checked))
    }
    console.log(array)

    window.electronAPI4.sendData({tasks: tasks, checks: array})
}

