import {sidebar_state, show_hide_sidebar, current_sidebar, enchance_ideas, enchance_history} from "./sidebar.mjs";
import {todo_html} from "./premade.mjs";
import {categories, change_check, show_steps} from "./render.mjs";

export let saved_sidebar = ""
export let goal_pressed = false

let base = null

$(document).on('click', '.todo', function (event) {
    saved_sidebar = document.getElementById("rightbar").innerHTML

    if (sidebar_state === false) show_hide_sidebar()
    if (event.target.children.length !== 0 && event.target.children.length !== 2) {
        let base = event.target
        if (event.target.children.length === 1) base = event.target.parentNode

        let steps_html = build_edit_steps(base)
        show_goal_edit(steps_html, base)
        enchance_edit(base)
        document.getElementById("closeEdit").addEventListener('click', () => show_hide_sidebar())
        goal_pressed = true
    }
});

function build_edit_steps(base) {
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

function show_goal_edit(steps_html, base) {
    let main_goal = base.children[2].children[0].innerText
    let check_state = ""
    if (base.getElementsByClassName("check_task")[0].checked === true) check_state = "checked"

    document.getElementById("rightbar").innerHTML = todo_html(main_goal, check_state, steps_html)
    enchance_edit(base)

    let goals = document.getElementsByClassName("todo")
    let goal_id = 0
    for (let i = 0; i < goals.length; i++) if (goals[i] === base) goal_id = i

    document.getElementById("editCheck").addEventListener('click', () => {
        let state = Number(document.getElementById("editCheck").checked)
        base.getElementsByClassName("check_task")[0].checked = state
        change_check(goal_id)

        if (state) goal_id = document.getElementsByClassName("todo").length - 1
        else goal_id = document.getElementById("todosArea").children.length - 1
        base = document.getElementsByClassName("todo")[goal_id]
    })

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

            window.goalsAPI.changeChecksStep({goal_id: goal_id, step_id: i, state: state})
        })
    }


    let new_category = 1;
    (function () {
        let show = false
        let displays = ["none", "block"]

        document.getElementById("selectCategory2").addEventListener('click', () => {
            show = !show
            document.getElementById("categoryPicker2").style.display = displays[Number(show)]
            if (show === true) {
                let array = document.getElementsByClassName("category")
                for (let i = 0; i < array.length; i++) {
                    array[i].addEventListener('click', (event) => {
                        let text = document.getElementsByClassName("categoryName")[i].innerHTML
                        new_category = i + 1
                        document.getElementById("selectCategory2").innerText = text;
                        document.getElementById("selectCategory2").style.background = categories[new_category];
                    })
                }
            }
        })
    })();
}


function enchance_edit(base) {
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
            change_step(i, base, input)
        })
    }
    add_step_edit(base)
}


function add_step_edit(base) {
    document.getElementById("editNewStep").addEventListener('click', () => {
        let steps_html = build_edit_steps(base)
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
            } else change_step(edit_steps.length - 1, base, input)
        })

        for (let i = 0; i < edit_steps.length - 1; i++) {
            edit_steps[i].addEventListener("blur", () => {
                let input = document.getElementsByClassName("editTextStep")[i].value
                change_step(i, base, input)
            })
        }
        add_step_edit(base)
    })
}

function change_step(index, base, value) {
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

document.getElementById("main").addEventListener('click', () => close_edit())

export function close_edit() {
    if (goal_pressed === true) {
        goal_pressed = false
        document.getElementById("rightbar").innerHTML = saved_sidebar
        if (!current_sidebar) enchance_history()
        else {
            enchance_ideas()
            document.getElementById("addIdeas").addEventListener('click', () => new_idea())
            $("#entryIdeas").on('keyup', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) new_idea()
            });
        }
    } else goal_pressed = false
}

export function goal_pressed_false(){
    goal_pressed = false
}
