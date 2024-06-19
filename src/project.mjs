import {categories, check_border, decode_text, getIdByColor} from "./data.mjs";
import {
    _input_html,
    _steps_html,
    _show_sidebar,
    build_view,
    dragula_day_view,
    _hide_sidebar,
    todo_dragged, set_todo_dragged, change_check,
} from "./render.mjs";
import {l_date} from "./date.js";
import {show_hide_sidebar} from "./sidebar.mjs";

export let project_pos = null
let block_prev_drag = 0
let current_goal_id = 0

$(document).on('click', '.projectType', function (event) {
    show_project_sidebar(this)
});

/**
 * opens sidebar and displays project sidebar
 */
function show_project_sidebar(that) {
    project_pos = $('.projectType').index(that)
    let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')
    let project_name = $('.dashProjectName').eq(project_pos).text()
    _show_sidebar()
    $('#rightbar').html(`
        <div id="sideProjectHeader">
            <div id="sideProjectClose">⨉</div>
            <div id="sideProjectIcon">
                <img src="${project_icon}" alt="">               
            </div>
            <div id="sideProjectTitle" style="background-color: ${project_color}">
                <img src="images/goals/polaura.png" alt="">
                <span>${project_name}</span>
                <img id="polaura2" src="images/goals/polaura.png" alt="">
            </div>
        </div>
        <div id="sideProjectOptions">
            <div class="sideProjectOption">Done</div>
            <div class="sideProjectOption">Doing</div>
            <div class="sideProjectOption" style="background-color: ${project_color}">To do</div>
        </div>
        <div id="sideProjectGoals">
            
        </div>
    `)

    window.goalsAPI.askProjectSidebar({project_pos: project_pos, option: 2, current_date: l_date.day_sql})
}

$(document).on('click', '.sideProjectOption', function () {
    change_sidebar_option(this)
})

/**
 * changes type of displayed goals from project
 * @param that html element of selected sidebar project option
 */
function change_sidebar_option(that){
    let side_project_option = $('.sideProjectOption')
    let option = side_project_option.index(that)

    let color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    side_project_option.css('background-color', '#2A231F')
    $(that).css('background-color', color)

    window.goalsAPI.askProjectSidebar({project_pos: project_pos, option: option, current_date: l_date.day_sql})
}


$(document).on('click', '#sideProjectGoals .check_task', function () {
    let check_state = !$(this).prop('checked')
    let goal_index = $('#sideProjectGoals .check_task').index(this)
    $(this).closest('.todo').remove()

    if (check_state){
        window.goalsAPI.goalRemoveDate({id: goal_index, option: 1})
    }
    else{
        window.goalsAPI.changeChecksGoal({id: goal_index, state: 1, option: 1})
    }
});

window.goalsAPI.getProjectSidebar((goals) => {
    build_project_sidebar(goals)
})

function build_project_sidebar(goals) {
    current_goal_id = 0
    let side_project_goals = $('#sideProjectGoals')
    side_project_goals.html("")

    for (let i = 0; i < goals.length; i++) {
        side_project_goals.append(build_project_goal(goals[i]))
    }
    dragula_day_view()
}

window.goalsAPI.getProjectsInfo((projects) => set_projects_options(projects))

/**
 * sets projects options on dashboard and sidebar
 * @param projects data of projects ,
 */
function set_projects_options(projects) {
    let projects_HTML = ""
    let project_types_HTML = ""

    for (let i = 0; i < projects.length; i++) {
        let project_class = "dashProject"
        if (i % 2 === 0) project_class = "dashProject dashProjectRight"
        let icon_color = categories[projects[i].category][0]

        projects_HTML += _dash_project_HTML(project_class, icon_color, projects[i].icon, projects[i].name)
        project_types_HTML += _type_project_HTML(icon_color, projects[i].icon, projects[i].name)
    }
    $('#dashProjects').html(projects_HTML)
    $('#projectTypes').html(project_types_HTML)
}


/**
 * Making html format of project option on dashboard
 * @param project_class defines if project is on the right side
 * @param icon_color color of the project option
 * @param icon icon name in path
 * @param name name of project
 * @returns {string} HTML format
 * @private
 */
function _dash_project_HTML(project_class, icon_color, icon, name) {
    return `
        <div class="${project_class}">
            <div class="dashProjectIcon" style="background-color: ${icon_color}">
                <img src="images/goals/projects/${icon}.png">
            </div>
            <span class="dashProjectName">${name}</span>
        </div>`
}

/**
 * Making html format of project type on sidebar
 * @param icon_color color of the project option
 * @param icon icon name in path
 * @param name name of project
 * @returns {string} HTML format
 * @private
 */
function _type_project_HTML(icon_color, icon, name) {
    return `
        <div class="projectType" style="background-color: ${icon_color}">
            <img class="projectTypeImg" src="images/goals/projects/${icon}.png" alt="">
            <div class="projectName" style="background-color: ${icon_color}">
                ${name}
            </div>
        </div>`
}


$(document).on('click', '.dashProject', function () {
    project_pos = $('.dashProject').index(this)
    project_view(project_pos)
})


/**
 * Displays project view
 */
function project_view(project_pos) {

    let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')
    let project_name = $('.dashProjectName').eq(project_pos).text()

    _hide_sidebar()
    build_view(_project_view_main(project_color), _project_view_header(project_color, project_icon, project_name))
    window.goalsAPI.askProjectGoals({project_pos: project_pos})

    _set_input_category(project_color)

}



/**
 * sets default input category for project
 * @param project_color color of selected project
 */
function _set_input_category(project_color){
    let category_id = getIdByColor(categories, project_color)
    let select_category = $('#selectCategory')

    select_category.css('background-color', categories[category_id][0])
    select_category.text(categories[category_id][1])
}
window.goalsAPI.getProjectGoals((goals) => build_project_view(goals))

/**
 * Builds project view using received goals data
 * Depending on goal type it goes to specific container
 * @param goals goals data
 */
function build_project_view(goals) {
    current_goal_id = 0
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_html(goals[i].steps, goals[i].category)
        goals[i]['goal'] = decode_text(goals[i]['goal'])
        if (Number(goals[i]['check_state']) === 1) $('#projectDone .projectSectionGoals').append(build_project_goal(goals[i]))
        else if (goals[i]['addDate'] !== "") $('#projectDoing .projectSectionGoals').append(build_project_goal(goals[i]))
        else $('#projectTodo .projectSectionGoals').append(build_project_goal(goals[i]))
    }
    dragula_project_view()
}


/**
 * Drag and Drop for project view
 */
function dragula_project_view(){
    block_prev_drag = 0

    let dragged_task

    dragula(Array.from($('.projectSectionGoals')), {
        copy: function (el) {
            return true
        },
        accepts: function (el, target) {
            block_prev_drag = 0
            return $(target).parent().attr('id') !== "projectDoing";
        },
        moves: function (el) {
            if (block_prev_drag === 0) {
                block_prev_drag = 1
                return true
            } else return false
        },
    }).on('drag', function (event){
        set_todo_dragged(true)
        block_prev_drag = 0
        dragged_task = $(event)
    }).on('drop', function (event){
        let new_goal_pos = $('#projectTodo .todo').index(event)

        let drag_parent_id = dragged_task.closest('.projectSection').attr('id')
        let drop_parent_id = $(event).closest('.projectSection').attr('id')

        if (drag_parent_id !== 'projectDone' && drop_parent_id === 'projectDone') move_to_done(new_goal_pos, dragged_task)
        else if (drag_parent_id !== 'projectTodo' && drop_parent_id === 'projectTodo') move_to_todo(new_goal_pos, dragged_task)
    })
}



/**
 * project goal type change to done by drag
 * @param new_goal_pos new position of moved goal
 * @param dragged_task pressed task
 */
function move_to_done(new_goal_pos, dragged_task){
    let goal_id = $(dragged_task).find('.todoId').text()
    $(dragged_task).remove()
    window.goalsAPI.changeChecksGoal({id: goal_id, state: 1, option:0})
    $('#projectDone .todo .checkDot').eq(new_goal_pos).css('background-image', `url('images/goals/check.png')`)
    $('.check_task').eq(new_goal_pos).attr('checked', true)
}

/**
 * project goal type change to todo by drag
 * @param new_goal_pos new position of moved goal
 * @param dragged_task pressed task
 */
function move_to_todo(new_goal_pos, dragged_task){
    let goal_id = $(dragged_task).find('.todoId').text()
    $(dragged_task).remove()
    window.goalsAPI.goalRemoveDate({id: goal_id})
    $('#projectTodo .checkDot').eq(new_goal_pos).css('background-image', ``)
    $('.check_task').eq(new_goal_pos).attr('checked', false)
}


$(document).on('click', '#projectContent .check_task', function () {
    change_project_check(this)
});

/**
 * changes check of project goal on checkbox click
 * @param that pressed checkbox of goal
 */
function change_project_check(that){
    let check_task = $('.check_task')
    let id = check_task.index(that)
    let check_state = !check_task.eq(id).prop('checked')

    let goal_id = $('.todoId').eq(id).text()
    let todo = $('.todo').eq(id)
    if (check_state) {
        $('.checkDot').eq(id).css('background-image', ``)
        $('#projectTodo .projectSectionGoals').append(todo)
        window.goalsAPI.goalRemoveDate({id: goal_id})
    }
    else{
        $('.checkDot').eq(id).css('background-image', `url('images/goals/check.png')`)
        $('#projectDone .projectSectionGoals').append(todo)
        window.goalsAPI.changeChecksGoal({id: goal_id, state: 1})
    }
    dragula_project_view()
}

$(document).on('click', '.projectEmblem', function () {
    project_pos = $(this).find('.projectPos').text()
    project_view(project_pos)
});

export function set_block_prev_drag_project(option) {
    block_prev_drag = option
}

/**
 * creates HTML of project goal
 * @param goal data of project goal
 * @returns {string} project goal in HTML format
 */
export function build_project_goal(goal) {
    let todo_id = current_goal_id++
    let category_color = categories[goal.category][0]
    let check_state = goal.check_state ? "checked" : "";
    let todo_area = goal.check_state ? "#todosFinished" : "#todosArea";
    let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
    let url = `images/goals/rank${goal.difficulty}.svg`
    let already_emblem = goal.already ? already_emblem_HTML() : ""

    return `
        <div class='todo'>
            <div class="todoId">${todo_id}</div>
            <div class='todoCheck' style="background: ${category_color} url(${url}) no-repeat">
                <div class="checkDot" style="background-image: ${check_bg}; border: 2px solid ${check_border[goal.importance]}"></div>
                <input type='checkbox' class='check_task' ${check_state}>
            </div>
            <div class='taskText'>
                <span class='task'> ${goal.goal} </span>
                ${goal.steps}
            </div>
            ${already_emblem}
        </div>`
}

/**
 * Creates header of project view HTML
 * @returns {string}
 */
function _project_view_header(color, icon, name) {
    return `
        <div id="projectHeader" style="background-color: ${color}">
            <img src="${icon}">
            <div id="projectName">${name}</div>
        </div>`
}

/**
 * Creates main element of project view HTML
 * @param color bg color of project sections
 * @returns {string}
 */
function _project_view_main(color) {
    return `
        <div id="projectContent">
            <div class="projectSection" id="projectDone">
                <div class="projectSectionTitle" style="background-color: ${color}">Done</div>
                <div class="projectSectionGoals">
                
                </div>
            </div>
            <div class="projectSection" id="projectDoing">
                <div class="projectSectionTitle" style="background-color: ${color}">Doing</div>
                <div class="projectSectionGoals">
                
                </div>
            </div>
            <div class="projectSection" id="projectTodo">
                <div class="projectSectionTitle" style="background-color: ${color}">To Do</div>
                <div class="projectSectionGoals">
                
                </div>
            </div>
            ${_input_html()}
        </div>`
}

export function project_emblem_html(project_pos) {
    let project_emblem = ''
    if (project_pos !== -1 && project_pos !== undefined) {
        let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
        let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')

        project_emblem = `
            <div class="projectEmblem" style="background-color: ${project_color}">
                <img src="${project_icon}">
                <div class="projectPos">${project_pos}</div>
            </div>
        `
    }
    return project_emblem
}

export function already_emblem_HTML(){
    return `
        <div class="alreadyEmblem">
            <span class="alreadyEmblemILetter">I</span>
            <span class="alreadyEmblemNLetter">N</span>
        </div>`
}

/**
 * Resets project selection
 */
export function reset_project_pos() {
    project_pos = null
}

$(document).on('click', '#sideProjectClose', () => _hide_sidebar())