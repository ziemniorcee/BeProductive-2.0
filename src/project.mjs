import {
    categories,
    check_border,
    decode_text, findNameByPath, findPathByName,
    getIdByColor,
    loadIcons, merged_icons,
    projects
} from "./data.mjs";
import {
    _categories_HTML,
    change_order,
    _steps_HTML,
    day_view,
    dragula_day_view,
} from "./render.mjs";
import {l_date} from "./date.js";
import {dragula_week_view} from "./weekView.mjs";
import {dragula_month_view} from "./monthView.mjs";
import {_hide_sidebar, _show_sidebar} from "./sidebar.mjs";


export let project_pos = null
let block_prev_drag = 0
let current_goal_id = 0

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
            <div id="sideProjectClose">⨉</div>
            <div id="sideProjectIcon">
                <img src="${project_icon}" alt="">               
            </div>
            <div id="sideProjectTitle" style="background-color: ${project_color}">
                <img src="images/goals/polaura.png" alt="">
                <span>${project_name}</span>
                <img class="polaura2" src="images/goals/polaura.png" alt="">
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
    window.projectsAPI.askProjectSidebar({
        project_pos: project_pos,
        option: 2,
        current_dates: l_date.get_current_dates()
    })
}

$(document).on('click', '.sideProjectOption', function () {
    change_sidebar_option(this)
})

/**
 * changes type of displayed goals from project
 * @param that html element of selected sidebar project option
 */
function change_sidebar_option(that) {
    let side_project_option = $('.sideProjectOption')
    let option = side_project_option.index(that)

    let color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    side_project_option.css('background-color', '#2A231F')
    $(that).css('background-color', color)
    window.projectsAPI.askProjectSidebar({
        project_pos: project_pos,
        option: option,
        current_dates: l_date.get_current_dates()
    })
}


$(document).on('click', '#sideProjectGoals .check_task', function () {
    check_sidebar_project_goal(this)
});

function check_sidebar_project_goal(selected_check) {
    let check_state = !$(selected_check).prop('checked')
    let goal_index = $('#sideProjectGoals .check_task').index(selected_check)

    let todo = $('#sideProjectGoals .todo').eq(goal_index)
    let is_in = todo.find(".alreadyEmblem").length

    todo.eq(goal_index).remove()

    if (check_state) {
        window.goalsAPI.goalRemoveDate({id: goal_index, option: 1})
    } else {
        window.goalsAPI.changeChecksGoal({id: goal_index, state: 1, option: 1})
    }

    if (is_in) {
        day_view()
    }
}

window.projectsAPI.getProjectSidebar((goals) => {
    build_project_sidebar(goals)
})

function build_project_sidebar(goals) {
    current_goal_id = 0
    let side_project_goals = $('#sideProjectGoals')
    side_project_goals.html("")

    for (let i = 0; i < goals.length; i++) {
        side_project_goals.append(build_project_goal(goals[i]))
    }
    if ($('#todosAll').length) dragula_day_view()
    else if ($('.weekDay').length) dragula_week_view()
    else dragula_month_view()
}

window.projectsAPI.projectToGoal((steps, position) => get_goal_from_sidebar(steps, position))

/**
 * adds steps to the project from project sidebar
 * @param steps steps data
 * @param position position of dragged goal
 */
function get_goal_from_sidebar(steps, position) {
    change_order()
    let category = getIdByColor(categories, $('#main .todoCheck').eq(position).css('backgroundColor'))

    if ($('#todosAll').length) $('#main .taskText').eq(position).append(_steps_HTML(steps, category))
}


$(document).on('click', '#dashMyDayBtn, #dashTomorrowBtn, #dashDay, #dashWeek', function () {
    fix_project_sidebar(this)
})

export function fix_project_sidebar(selected_button) {
    if ($('#sideProjectHeader').length) {
        let options = $('.sideProjectOption')
        let project_option
        let background_color = $('#sideProjectTitle').css("background-color")
        for (let i = 0; i < options.length; i++) {
            if (options.eq(i).css('background-color') === background_color) project_option = i
        }

        window.projectsAPI.askProjectSidebar({
            project_pos: project_pos,
            option: project_option,
            current_dates: l_date.get_current_dates(selected_button)
        })
    }
}


/**
 * sets projects options on dashboard and sidebar
 * @param projects data of projects ,
 */
export function set_projects_options() {
    let projects_HTML = ""
    let project_types_HTML = ""
    for (let i = 0; i < projects.length; i++) {
        let project_class = "dashProject"
        if (i % 2 === 0) project_class = "dashProject dashProjectRight"
        let icon_color = categories[projects[i].category][0]

        let icon_path = findPathByName(projects[i].icon)
        projects_HTML += _dash_project_HTML(project_class, icon_color, icon_path, projects[i].name)
        project_types_HTML += _type_project_HTML(icon_color, icon_path, projects[i].name)
    }

    projects_HTML += _dash_add_project_HTML()
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
function _dash_project_HTML(project_class, icon_color, icon_path, name) {
    return `
        <div class="${project_class}">
            <div class="dashProjectIcon" style="background-color: ${icon_color}">
                <img src="${icon_path}" alt="">
            </div>
            <span class="dashProjectName">${name}</span>
        </div>`
}

function _dash_add_project_HTML() {
    return `
        <div class="dashProject" style=" border: 1px #D8E1E7 dashed">
            <div class="dashProjectIcon" style="background-color: #2979FF">
                <img src="images/goals/plus.png" alt="">
            </div>
            <span class="dashProjectName">New</span>
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
            <img class="projectTypeImg" src="${icon}" alt="">
            <div class="projectName" style="background-color: ${icon_color}">
                ${name}
            </div>
        </div>`
}

$(document).on('click', '.dashProject', function () {
    let jq_dash_project = $('.dashProject')
    project_pos = jq_dash_project.index(this)
    let how_many_projects = jq_dash_project.length
    if (project_pos < how_many_projects - 1) {
        project_view(project_pos)
    } else {
        project_pos = null
        open_add_project()
    }
})


/**
 * Displays project view
 */
function project_view(project_pos) {
    let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
    let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')
    let project_name = $('.dashProjectName').eq(project_pos).text()

    _hide_sidebar()
    set_project_view(project_color, project_icon, project_name)

    window.projectsAPI.askProjectGoals({project_pos: project_pos})

    _set_input_category(project_color)
}


/**
 * sets default input category for project
 * @param project_color color of selected project
 */
function _set_input_category(project_color) {
    let category_id = getIdByColor(categories, project_color)
    let select_category = $('#selectCategory1')

    select_category.css('background-color', categories[category_id][0])
    select_category.text(categories[category_id][1])
}

/**
 * Builds new project creation window
 */
export function open_add_project() {
    $("#vignette").css('display', 'block')
    const new_project_template = $('#newProjectTemplate').prop('content');
    let $new_project_clone = $(new_project_template).clone()

    $new_project_clone.find('.categoryPicker').html(_categories_HTML())
    $("#vignette").html($new_project_clone)
}


$(document).on('click', '#newProjectDiscard', () => {
    $('#vignette').css('display', 'none')
})

$(document).on('click', '.iconOption', function (event) {
    event.stopPropagation()
    set_icon(this)
})

function set_icon(that) {
    let project_setting_icon = $('#projectSettingsIcon')

    let icon = $(that).find("img").attr('src')
    $('#newProjectIconPicker').css("visibility", "hidden")
    project_setting_icon.find("img").attr('src', icon)
    project_setting_icon.css('background-color', '#2A231F')
    project_setting_icon.find("img").css('left', '0')
}


$(document).on('click', '#newProjectCreate', function () {
    new_project()
})

/**
 * Builds new project based on given settings
 */
function new_project() {
    let project_setting_icon = $('#projectSettingsIcon')
    let category = getIdByColor(categories, $('#selectCategory3').css('backgroundColor'))

    let name = $('#newProjectName').val()

    let icon_path = $('#projectSettingIconSrc').attr('src')
    let icon_name = findNameByPath(icon_path);

    if (name === "") {
        $('#newProjectError').text("NO NAME GIVEN")
    } else if (icon_path === "images/goals/project.png") {
        $('#newProjectError').text("NO ICON SELECTED")
    } else {
        window.projectsAPI.newProject({category: category, name: name, icon: icon_name})
        $('#vignette').css('display', 'none')
        console.log(icon_name)
        projects.push({id: 0, name: name, category: category, icon: icon_name, x: null, y: null})
        set_projects_options()
    }

}

window.projectsAPI.getProjectGoals((goals) => build_project_view(goals))

/**
 * Builds project view using received goals data
 * Depending on goal type it goes to specific container
 * @param goals goals data
 */
function build_project_view(goals) {
    current_goal_id = 0
    for (let i = 0; i < goals.length; i++) {
        goals[i]['steps'] = _steps_HTML(goals[i].steps, goals[i].category)
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
function dragula_project_view() {
    block_prev_drag = 0

    let dragged_task

    dragula(Array.from($('.projectSectionGoals')), {
        copy: function () {
            return true
        },
        accepts: function (el, target) {
            block_prev_drag = 0
            return $(target).parent().attr('id') !== "projectDoing";
        },
        moves: function () {
            if (block_prev_drag === 0) {
                block_prev_drag = 1
                return true
            } else return false
        },
    }).on('drag', function (event) {
        block_prev_drag = 0
        dragged_task = $(event)
    }).on('drop', function (event) {

        let drag_parent_id = dragged_task.closest('.projectSection').attr('id')
        let drop_parent_id = $(event).closest('.projectSection').attr('id')

        if (drag_parent_id !== 'projectDone' && drop_parent_id === 'projectDone') {
            let new_goal_pos = $('#projectDone .todo').index(event)
            move_to_done(new_goal_pos, dragged_task)
        } else if (drag_parent_id !== 'projectTodo' && drop_parent_id === 'projectTodo') {
            let new_goal_pos = $('#projectTodo .todo').index(event)
            move_to_todo(new_goal_pos, dragged_task)
        }
    })
}


/**
 * project goal type change to done by drag
 * @param new_goal_pos new position of moved goal
 * @param dragged_task pressed task
 */
function move_to_done(new_goal_pos, dragged_task) {

    let goal_id = $(dragged_task).find('.todoId').text()
    $(dragged_task).remove()
    window.goalsAPI.changeChecksGoal({id: goal_id, state: 1, option: 0})
    $('#projectDone .todo .checkDot').eq(new_goal_pos).css('background-image', `url('images/goals/check.png')`)
    $('.check_task').eq(new_goal_pos).attr('checked', true)
}

/**
 * project goal type change to goals by drag
 * @param new_goal_pos new position of moved goal
 * @param dragged_task pressed task
 */
function move_to_todo(new_goal_pos, dragged_task) {
    let goal_id = $(dragged_task).find('.todoId').text()
    $(dragged_task).remove()
    window.goalsAPI.goalRemoveDate({id: goal_id})
    $('#projectTodo .checkDot').eq(new_goal_pos).css('background-image', ``)
    $('.check_task').eq(new_goal_pos).attr('checked', false)
}


$(document).on('click', '#projectContent .check_task', function (event) {
    event.stopPropagation()
    let selected_goal = $(this).closest('.todo')
    change_project_check(selected_goal)
});

/**
 * changes check of project goal on checkbox click
 * @param that pressed checkbox of goal
 */
export function change_project_check(selected_goal) {
    let check_state = !selected_goal.find('.check_task').prop('checked')
    let goal_id = selected_goal.find('.todoId').text()

    if (check_state) {
        selected_goal.find('.checkDot').css('background-image', ``)
        $('#projectTodo .projectSectionGoals').append(selected_goal)
        window.goalsAPI.goalRemoveDate({id: goal_id})
    } else {
        selected_goal.find('.checkDot').css('background-image', `url('images/goals/check.png')`)
        $('#projectDone .projectSectionGoals').append(selected_goal)
        window.goalsAPI.changeChecksGoal({id: goal_id, state: 1})
    }
    dragula_project_view()
}

$(document).on('click', '.projectEmblem', function (event) {
    event.stopPropagation()
    project_pos = $(this).find('.projectPos').text()
    project_view(project_pos)
});


/**
 * creates HTML of project goal
 * @param goal data of project goal
 * @returns {string} project goal in HTML format
 */
export function build_project_goal(goal) {
    let todo_id = current_goal_id++
    let category_color = categories[goal.category][0]
    let check_state = goal.check_state ? "checked" : "";
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
                <span class='task'> ${decode_text(goal.goal)} </span>
                ${goal.steps}
            </div>
            ${already_emblem}
        </div>`
}

/**
 * BUild project view from templates
 */
function set_project_view(color, icon, name) {
    const header_template = $('#projectViewHeaderTemplate').prop('content');
    let $header_clone = $(header_template).clone()

    $header_clone.find('#projectHeader').css('background-color', color)
    $header_clone.find('#projectHeaderIcon').attr('src', icon)
    $header_clone.find('#projectName').text(name)

    const main_template = $('#projectViewMainTemplate').prop('content');
    let $main_clone = $(main_template).clone()

    $main_clone.find('.projectSectionTitle').css('background-color', color)

    let categories_html = _categories_HTML()

    const input_template = $('#todoInputTemplate').prop('content');
    let $input_clone = $(input_template).clone()
    $input_clone.find('#categoryPicker1').html(categories_html)
    $('#main').html($header_clone)
    $('#main').append($main_clone)
    $('#projectContent').append($input_clone)
}

$(document).on('click', '#projectDelete', () => {
    $("#vignette").css('display', 'block')
    const delete_project_template = $('#deleteprojectTemplate').prop('content');
    let $delete_clone = $(delete_project_template).clone()
    $("#vignette").append($delete_clone)
})

$(document).on('click', '#deleteProjectConfirm', () => {
    delete_project()
})

function delete_project() {
    window.projectsAPI.deleteProject({position: project_pos})

    $('#vignette').html('')
    $('#vignette').css('display', 'none')
    projects.splice(project_pos, 1)

    set_projects_options()
    day_view()
}


$(document).on('click', '#deleteProjectCancel', () => {
    $('#vignette').html('')
    $('#vignette').css('display', 'none')
})

/**
 * builds html of project emblem
 * @param project_pos
 * @returns {string} returns HTML
 */
export function project_emblem_html(project_pos) {
    let project_emblem = ''
    if (project_pos !== -1 && project_pos !== undefined) {
        let project_color = $('.dashProjectIcon').eq(project_pos).css('background-color')
        let project_icon = $('.dashProjectIcon img').eq(project_pos).attr('src')

        project_emblem = `
            <div class="projectEmblem" style="background-color: ${project_color}">
                <img src="${project_icon}" alt="">
                <div class="projectPos">${project_pos}</div>
            </div>
        `
    }
    return project_emblem
}

/**
 * build HTML of project being in
 * @returns {string} HTML alredy emblem
 */
export function already_emblem_HTML() {
    return `
        <div class="alreadyEmblem">
            <div class="alreadyEmblemILetters">
                <span class="alreadyEmblemILetter">I</span>
                <span class="alreadyEmblemNLetter">N</span>
            </div>
        </div>`
}

/**
 * Resets project selection
 */
export function reset_project_pos() {
    project_pos = null
}

$(document).on('click', '#sideProjectClose', () => _hide_sidebar())


/**
 * creates picker based on existing projects
 * @returns {string} HTML of project picker
 */
export function _project_picker_HTML() {
    let picks_HTML = `
        <div class="editPickProject">
            <div class="editProjectIcon"></div>
            <div class="editProjectName">None</div>
        </div>`

    for (let i = 0; i < projects.length; i++) {
        let icon_color = categories[projects[i]['category']][0]
        let icon_path = findPathByName(projects[i].icon)
        picks_HTML += `
            <div class="editPickProject">
                <div class="editProjectIcon" style="background-color: ${icon_color}">
                    <img class="editPickProjectIcon" alt="" src="${icon_path}">
                </div>
                <div class="editProjectName">${projects[i]["name"]}</div>
            </div>`
    }
    return picks_HTML
}

$(document).on('click', "#projectSettingIconSrc", async () => await open_icon_picker())

async function open_icon_picker(){
    if ($('#iconPicker').length === 0) {
        await loadIcons()
        const icon_picker_template = $('#iconPickerTemplate').prop('content');
        let $icon_picker_clone = $(icon_picker_template).clone()
        $("#projectSettingsIcon").append($icon_picker_clone)

        let $icon_picker_list = $('#iconPickerList')

        for (const key in merged_icons) {
            $icon_picker_list.append(`
            <li class="iconPickerListElement">
                <img src="${merged_icons[key]['path']}">
            </li>`)
        }
    }
}


$(document).on('click', '#iconUpload', (event) => {
    event.stopPropagation()
})

$(document).on('change', '#iconUpload', async (event) => await icon_upload(event))

/**
 * Gets icon from user and changes it to white color
 * @param event change event of file uploading
 */
async function icon_upload(event){
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const pixels = imageData.data;

                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const alpha = pixels[i + 3];

                    if (r < 50 && g < 50 && b < 50 && alpha > 0) {
                        pixels[i] = 255;
                        pixels[i + 1] = 255;
                        pixels[i + 2] = 255;
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                const processedImageSrc = canvas.toDataURL();

                const base64Data = processedImageSrc.split(',')[1];
                const fileName = file.name;

                const result = await window.electronAPI.saveFile(fileName, base64Data);
                $('#projectSettingIconSrc').attr('src', result['path']);
                if (result.success) {
                    await loadIcons()

                } else {
                    alert(`Error: ${result.error}`);
                }
            };
        };

        reader.readAsDataURL(file);
    }
    $('#iconPicker').remove()
}

$(document).on('click', '.iconPickerListElement', function () {
    select_icon(this)
})

/**
 * event of selecting icon
 * @param that selected icon
 */
function select_icon(that){
    let img_path = $(that).find('img').attr('src')

    $("#projectSettingIconSrc").attr('src', img_path)
    $('#iconPicker').remove()
}

$(document).on('click', '#dashNewProject', function () {
    $('#iconPicker').remove()
})