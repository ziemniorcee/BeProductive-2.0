function init() {
    dragula([document.querySelector("#todosArea")]);
}

let tasks = []

function press() {
    let elements = document.getElementsByClassName("goal_id")

    tasks = []
    for (let i = 0; i < elements.length; i++) {
        tasks.push(elements[i].textContent)
    }
}

function unpress() {
    let elements = document.getElementsByClassName("goal_id")
    let new_tasks = []

    if (tasks.length < elements.length){
        for (let i = 0; i < elements.length-1; i++) {
            new_tasks.push(elements[i].textContent)
        }
        if (JSON.stringify(tasks) !== JSON.stringify(new_tasks)) {
            window.goalsAPI.rowsChange({after: new_tasks})
        }
    }
}
