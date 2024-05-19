import {categories, check_border} from "./data.mjs";
import {_input_html, _steps_html, _show_sidebar, build_view} from "./render.mjs";

export let project_pos = null

$(document).on('click', '.projectType', show_project_sidebar);

/**
 * opens sidebar and displays project sidebar
 */
function show_project_sidebar(){
    _show_sidebar()
    $('#rightbar').html(`
        <div id="sideProjectHeader">
            <div id="sideProjectIcon">
                <img src="images/goals/projects/keys.png">               
            </div>
            <div id="sideProjectTitle">
                <img src="images/goals/polaura.png">
                <span>Calculus</span>
                <img id="polaura2" src="images/goals/polaura.png">
            </div>
        </div>
        <div id="sideProjectOptions">
            <div class="sideProjectOption">Done</div>
            <div class="sideProjectOption">Doing</div>
            <div class="sideProjectOption" style="background-color: #002244">To do</div>
        </div>
        <div id="sideProjectGoals">
            
        </div>
    `)
    window.goalsAPI.askProjectGoals({project_pos: project_pos})

}

window.goalsAPI.askProjectsInfo()

window.goalsAPI.getProjectsInfo((projects) => set_projects_options(projects))


/**
 * sets projects options on dashboard and sidebar
 * @param projects data of projects ,
 */
function set_projects_options(projects){
    let projects_HTML = ""
    let project_types_HTML = ""

    for (let i = 0; i < projects.length; i++) {
        let project_class =  "dashProject"
        if (i % 2 === 0) project_class = "dashProject dashProjectRight"
        let icon_color = categories[projects[i].category][0]

        projects_HTML += _dash_project_HTML(project_class, icon_color, projects[i].icon, projects[i].name)
        project_types_HTML += _type_project_HTML(icon_color,projects[i].icon ,projects[i].name)
    }
    console.log(project_types_HTML)
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
function _dash_project_HTML(project_class, icon_color, icon, name){
    return`
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
function _type_project_HTML(icon_color,icon , name){
    return `
        <div class="projectType" style="background-color: ${icon_color}">
            <img class="projectTypeImg" src="images/goals/projects/${icon}.png" alt="">
            <div class="projectName" style="background-color: ${icon_color}">
                ${name}
            </div>
        </div>`
}


$(document).on('click', '.dashProject', function (){
    project_view(this)
})


/**
 * Displays project view
 */
function project_view(that){
    project_pos = $('.dashProject').index(that)
    let project_name = $('.dashProjectName').eq(project_pos).text()
    build_view(_project_view_main() ,_project_view_header())

    $('#mainTitle').text(project_name)

    window.goalsAPI.askProjectGoals({project_pos: project_pos})
}

window.goalsAPI.getProjectGoals((goals) => build_project_view(goals))

/**
 * Builds project view using received goals data
 * Depending on goal type it goes to specific container
 * @param goals goals data
 */
function build_project_view(goals){
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_html(goals[i].steps, goals[i].category)
        goals[i]['goal'] = goals[i]['goal'].replace(/`@`/g, "'").replace(/`@@`/g, '"')

        if (Number(goals[i]['check_state']) === 1) $('#projectDone').append(build_project_goal(goals[i]))
        else if(goals[i]['addDate'] !== "") $('#projectDoing').append(build_project_goal(goals[i]))
        else $('#projectTodo').append(build_project_goal(goals[i]))
    }
}

/**
 * creates HTML of project goal
 * @param goal data of project goal
 * @returns {string} project goal in HTML format
 */
function build_project_goal(goal) {
    let todo_id = $('.todo').length
    let category_color = categories[goal.category][0]
    let check_state = goal.check_state ? "checked" : "";
    let todo_area = goal.check_state ? "#todosFinished" : "#todosArea";
    let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
    let url = `images/goals/rank${goal.difficulty}.svg`

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
        </div>`
}

/**
 * Creates header of project view HTML
 * @returns {string}
 */
function _project_view_header(){
    return `
        <div id="projectHeader">
            <img src="images/goals/projects/keys.png">
            <div id="projectName">Calculus</div>
        </div>
    `
}

/**
 * Creates main element of project view HTML
 * @returns {string}
 */
function _project_view_main(){
    return `
        <div id="projectContent">
            <div class="projectSection" id="projectDone">
                <div class="projectSectionTitle">Done</div>
                
            </div>
            <div class="projectSection" id="projectDoing">
                <div class="projectSectionTitle">Doing</div>
                
            </div>
            <div class="projectSection" id="projectTodo">
                <div class="projectSectionTitle">To Do</div>
            
            </div>
            ${_input_html()}
        </div>
        
    `
}

/**
 * Resets project selection
 */
export function reset_project_pos(){
    project_pos = null
}