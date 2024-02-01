import {sidebar_state, show_hide_sidebar, current_sidebar, enchance_ideas, enchance_history} from "./sidebar.mjs";
import { change_check, select_category, show_steps} from "./render.mjs";
import {categories, getIdByColor} from "./data.mjs";
export let saved_sidebar = ""
export let goal_pressed = false

let base = null
let goal_id = 0


$(document).on('click', '.todo', function (event) { //weak point
    saved_sidebar = document.getElementById("rightbar").innerHTML
    goal_id = $('.todo').index(this)

    if (sidebar_state === false) show_hide_sidebar()
    if (event.target.children.length !== 0 && event.target.children.length !== 2) {//weak point
        base = event.target
        if (event.target.children.length === 1) base = event.target.parentNode
        show_goal_edit()

        document.getElementById("closeEdit").addEventListener('click', () => show_hide_sidebar())
        goal_pressed = true
    }
});


function show_goal_edit() {
    document.getElementById("rightbar").innerHTML = todo_html()

    _main_check()
    _steps_checks()
    _inputs()
    select_category("2")
    change_difficulty()
    change_importance()
}

function get_steps_html() {
    let steps_html = ""
    if (base.children[2].children.length > 1) {
        let array = base.children[2].children[2].children

        for (let i = 0; i < array.length; i++) {
            let check_state = ""
            if (array[i].children[0].checked === true) check_state = "checked"

            steps_html += `
                <div class="editStep">
                    <input type="checkbox" ${check_state} class="editCheckStep"><input type="text" class="editTextStep" value="${array[i].innerText.trim()}" spellcheck="false">
                </div>`
        }
    }
    return steps_html
}


function _main_check(){
    document.getElementById("editCheck").addEventListener('click', () => {
        let state = Number(document.getElementById("editCheck").checked)
        base.getElementsByClassName("check_task")[0].checked = state
        change_check(goal_id)

        if (state) goal_id = document.getElementsByClassName("todo").length - 1
        else goal_id = document.getElementById("todosArea").children.length - 1
        base = document.getElementsByClassName("todo")[goal_id]
    })
}

function _inputs() {
    document.getElementById("editText").addEventListener("blur", () => {
        let input = document.getElementById("editText").value
        if (base.children[2].children[0].innerText !== input) {
            base.children[2].children[0].innerText = input
            window.goalsAPI.changeTextGoal({input: input, id: Number(base.children[0].innerText)})
        }
    })
    let edit_steps = document.getElementsByClassName("editTextStep")

    for (let i = 0; i < edit_steps.length; i++) {
        edit_steps[i].addEventListener("blur", () => {
            let input = document.getElementsByClassName("editTextStep")[i].value
            change_step(i, input)
        })
    }
    add_step_edit(base)
}

function _steps_checks(){
    let steps = document.getElementById("editSteps").children
    for (let i = 0; i < steps.length - 1; i++) {
        steps[i].children[0].addEventListener("click", () => {
            let state = Number(steps[i].children[0].checked)
            base.children[2].children[2].children[i].children[0].checked = state
            let counter = base.children[2].children[1].children[1].children[0]

            if (state) {
                base.children[2].children[2].children[i].children[0].outerHTML = "<input type='checkbox' checked class='stepCheck'>"
                counter.innerText = Number(counter.innerText) + 1
            } else {
                base.children[2].children[2].children[i].children[0].outerHTML = "<input type='checkbox' class='stepCheck'>"
                counter.innerText = Number(counter.innerText) - 1
            }

            window.goalsAPI.changeChecksStep({goal_id: Number(base.children[0].innerText), step_id: i, state: state})
        })
    }
}

function add_step_edit() {
    document.getElementById("editNewStep").addEventListener('click', () => {
        let steps_html = get_steps_html()
        steps_html +=
            `<div class="editStep">
                <input type="checkbox" class="editCheckStep"><input type="text" class="editTextStep"  spellcheck="false">
            </div>`

        document.getElementById("editSteps").innerHTML =
            `${steps_html}
            <div id="editNewStep">
                <span>+</span>New Step
            </div>`

        let edit_steps = document.getElementsByClassName("editTextStep")

        edit_steps[edit_steps.length - 1].addEventListener("blur", () => {
            let input = document.getElementsByClassName("editTextStep")[edit_steps.length - 1].value
            if (base.children[2].children.length === 1) {
                base.children[2].innerHTML +=
                    `<div class='stepsShow'><img src='images/goals/up.png' alt="up">
                        <span class="check_counter">
                            <span class="counter">${0}</span>/<span class="maxCounter">${0}</span>
                        </span>
                    </div>
                    <div class='steps'></div>`
                base.children[2].children[1].addEventListener('click', (event) => show_steps(event))
            }
            let how_many_steps = base.children[2].children[2].children.length
            if (how_many_steps < edit_steps.length) {
                if (input !== "") {
                    base.children[2].children[2].innerHTML +=
                        `<div class='step'>
                            <input type='checkbox'  class='stepCheck'> <span class="step_text">${input}</span>
                        </div>`
                    window.goalsAPI.addStep({input: input, id: Number(base.children[0].innerText)})

                    let max_counter = base.children[2].children[1].children[1].children[1]
                    max_counter.innerText = Number(max_counter.innerText) + 1
                }
            } else change_step(edit_steps.length - 1, input)
        })

        for (let i = 0; i < edit_steps.length - 1; i++) {
            edit_steps[i].addEventListener("blur", () => {
                let input = document.getElementsByClassName("editTextStep")[i].value
                change_step(i, input)
            })
        }
        add_step_edit(base)
    })
}

function change_step(index, value) {
    if (value !== "") {
        base.children[2].children[2].children[index].children[1].innerText = value
        window.goalsAPI.changeStep({input: value, goal_id: Number(base.children[0].innerText), step_id: index})
    } else {
        let max_counter_html = base.getElementsByClassName("maxCounter")[0]
        max_counter_html.innerHTML = Number(max_counter_html.innerHTML) - 1

        let counter_html = base.getElementsByClassName("counter")[0]
        if (base.children[2].children[2].children[index].children[0].checked) {
            counter_html.innerHTML = Number(counter_html.innerHTML) - 1
        }

        if (base.children[2].children[2].children.length === 1) {
            base.children[2].children[1].remove()
            base.children[2].children[1].remove()
        } else base.children[2].children[2].children[index].remove()
        document.getElementsByClassName("editStep")[index].remove()

        window.goalsAPI.removeStep({goal_id: Number(base.children[0].innerText), step_id: index})
    }
}

export function change_category(){
    let new_category = getIdByColor(categories, document.getElementById("selectCategory2").style.backgroundColor)
    if (base.getElementsByClassName("stepsShow")[0]){
        base.getElementsByClassName("stepsShow")[0].style.backgroundColor = categories[new_category][0]
    }
    document.getElementsByClassName("todoCheck")[goal_id].style.backgroundColor = categories[new_category][0]
    window.goalsAPI.changeCategory({goal_id: Number(base.children[0].innerText), new_category: new_category})
}
document.getElementById("main").addEventListener('click', () => close_edit())


function change_difficulty(){
    document.getElementById("editDiff").addEventListener('click',  () =>{
        let difficulty = document.getElementById("editDiff").value
        let url = `images/goals/rank${difficulty}.svg`
        document.getElementsByClassName("todoCheck")[goal_id].style.backgroundImage = `url("${url}")`
        window.goalsAPI.changeDifficulty({goal_id: Number(base.children[0].innerText), difficulty: difficulty})
    })
}

function change_importance(){
    let check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 201, 14)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]
    document.getElementById("editImportance").addEventListener('click',  () =>{
        let importance = document.getElementById("editImportance").value
        document.getElementsByClassName("dot")[goal_id].style.borderColor = check_border[importance]
        window.goalsAPI.changeImportance({goal_id: Number(base.children[0].innerText), importance: importance})
    })
}

export function close_edit() { //weak point
    if (goal_pressed === true) {
        goal_pressed = false
        document.getElementById("rightbar").innerHTML = saved_sidebar
        if (!current_sidebar) enchance_history()
        else enchance_ideas()
    } else goal_pressed = false


}

export function goal_pressed_false(){
    goal_pressed = false
}




function todo_html (){
    let main_goal = base.children[2].children[0].innerText
    let steps_html = get_steps_html()
    let check_state = document.getElementsByClassName("check_task")[goal_id].checked === true ? "checked" : "";
    let category_id = getIdByColor(categories, document.getElementsByClassName("todoCheck")[goal_id].style.backgroundColor)
    let difficulty = document.getElementsByClassName("todoCheck")[goal_id].style.backgroundImage[22]//weak point

    let check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 201, 14)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]
    let importance = check_border.indexOf(document.getElementsByClassName("dot")[goal_id].style.borderColor)

    return `<div id="closeEdit">⨉</div>
        <div id="todoEdit">
            <div id="editMain">
                <input type="checkbox" id="editCheck" ${check_state}>
                <input type="text" id="editText" value="${main_goal}" spellcheck="false">
            </div>
            <div id="editSteps">
                ${steps_html}
                <div id="editNewStep">
                    <span>+</span>New Step
                </div>
            </div>
        </div>
        <div id="editOptions">
            <div id="optionsNames">
                <div>Category</div>
                <div>Difficulty</div>
                <div>Importance</div>
            </div>
            <div id="optionsConfig">
                <div id="selectCategory2" class="selectCategory" style="background: ${categories[category_id][0]}">${categories[category_id][1]}</div>
                <input type="range" class="r_todo" id="editDiff" min="0" max="4" value="${difficulty}">
                <input type="range" class="r_todo" id="editImportance" min="0" max="4" value="${importance}">
                <div class="categoryPicker" id="categoryPicker2">
                    <div class="category">
                        <span class="categoryButton"></span>
                        <span class="categoryName">None</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #32174D"></span>
                        <span class="categoryName">Work</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #002244"></span>
                        <span class="categoryName">School</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #023020"></span>
                        <span class="categoryName">House</span>
                    </div>
                </div>
            </div>
        </div>`;
}