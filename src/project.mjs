import {categories, check_border, decode_text, getIdByColor} from "./data.mjs";
import {_input_html, _steps_html, _show_sidebar, build_view, dragula_day_view} from "./render.mjs";
import {l_date} from "./date.js";

export let project_pos = null

$(document).on('click', '.projectType', function () {
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
            <div id="sideProjectIcon">
                <img src="${project_icon}">               
            </div>
            <div id="sideProjectTitle" style="background-color: ${project_color}">
                <img src="images/goals/polaura.png">
                <span>${project_name}</span>
                <img id="polaura2" src="images/goals/polaura.png">
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
    side_project_option.css('background-color', '#2A231F')
    $(that).css('background-color', '#002244')
    window.goalsAPI.askProjectSidebar({project_pos: project_pos, option: option, current_date: l_date.day_sql})
}

window.goalsAPI.getProjectSidebar((goals) => build_project_sidebar(goals))

function build_project_sidebar(goals) {
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
    project_view(this)
})


/**
 * Displays project view
 */
function project_view(that) {
    project_pos = $('.dashProject').index(that)
    let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')
    let project_name = $('.dashProjectName').eq(project_pos).text()

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
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_html(goals[i].steps, goals[i].category)
        goals[i]['goal'] = decode_text(goals[i]['goal'])
        if (Number(goals[i]['check_state']) === 1) $('#projectDone').append(build_project_goal(goals[i]))
        else if (goals[i]['addDate'] !== "") $('#projectDoing').append(build_project_goal(goals[i]))
        else $('#projectTodo').append(build_project_goal(goals[i]))
    }
}

/**
 * creates HTML of project goal
 * @param goal data of project goal
 * @returns {string} project goal in HTML format
 */
export function build_project_goal(goal) {
    let todo_id = $('.todo').length
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
            </div>
            <div class="projectSection" id="projectDoing">
                <div class="projectSectionTitle" style="background-color: ${color}">Doing</div>
            </div>
            <div class="projectSection" id="projectTodo">
                <div class="projectSectionTitle" style="background-color: ${color}">To Do</div>
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