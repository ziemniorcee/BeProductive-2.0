function init() {
    dragula([document.querySelector("#todosArea")]);
}

let tasks = []
let goals_len = 0

function press() {
    let elements = document.getElementsByClassName("task")
    tasks = []
    goals_len = elements.length
    for (let i = 0; i < goals_len; i++) {
        tasks.push(elements[i].textContent.replace("'", "`@`"))
    }
}

function unpress() {
    let elements = document.getElementsByClassName("task")
    let before = tasks
    tasks = []
    for (let i = 0; i < goals_len; i++) {
        tasks.push(elements[i].textContent.replace("'", "`@`"))
    }

    if (JSON.stringify(before) !== JSON.stringify(tasks)) {
        change()
    }
}

function change() {
    let elements = document.getElementsByClassName("check_task")
    let checks = []
    for (let i = 0; i < elements.length - 1; i++) {
        checks.push(Number(elements[i].checked))
    }
    window.goalsAPI.rowsChange({tasks: tasks, checks: checks})
}

