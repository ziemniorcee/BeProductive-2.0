function init() {
    dragula([document.querySelector("#todosArea")]);
}

let tasks = []

function press() {
    let elements = document.getElementsByClassName("todoId")

    tasks = []
    for (let i = 0; i < elements.length; i++) {
        tasks.push(elements[i].textContent)
    }
}

function unpress() {
    let elements = document.getElementsByClassName("todoId")
    let new_tasks = []
    if (tasks.length < elements.length){
        for (let i = 0; i < elements.length-1; i++) {
            new_tasks.push(elements[i].textContent)
        }
        if (JSON.stringify(tasks) !== JSON.stringify(new_tasks) && tasks.length!==0) {
            window.goalsAPI.rowsChange({after: new_tasks})
        }
    }
}
