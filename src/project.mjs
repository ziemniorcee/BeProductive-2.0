import {
    check_border,
    decode_text,
    getIdByColor,
} from "./data.mjs";

export class Project {
    constructor(app_data, app_date, app_categories, app_steps) {
        this.initEventListeners()
        this.data = app_data
        this.date = app_date
        this.categories = app_categories
        this.steps = app_steps

        this.decider = new Decider(app_data)
        this.project_pos = null
        this.current_goal_id = 0
        this.block_prev_drag = 0
    }

    initEventListeners() {
        window.projectsAPI.projectToGoal((steps, position) => this.get_goal_from_sidebar(steps, position))

        $(document).on('click', '#newProjectCreate', () => this.new_project())

        $(document).on('click', '#newProjectDiscard', () => {
            $('#vignette').css('display', 'none')
        })

        $(document).on('click', '.dashProject', async(event) => {
            let jq_dash_project = $('.dashProject')
            this.project_pos = jq_dash_project.index(event.currentTarget)
            let how_many_projects = jq_dash_project.length
            if (this.project_pos < how_many_projects - 1) {
                await this.project_view()
            } else {
                this.project_pos = null
                this.open_add_project()
            }
        })

        $(document).on('click', "#projectSettingIconSrc", async () => await this.open_icon_picker())

        $(document).on('click', '#iconUpload', (event) => event.stopPropagation())

        $(document).on('change', '#iconUpload', async (event) => await this.icon_upload(event))

        $(document).on('click', '.iconPickerListElement', (event) => this.select_icon(event.currentTarget))

        $(document).on('click', '#todosAll .projectEmblem', async (event) => {
            event.stopPropagation()
            this.project_pos = $(event.currentTarget).find('.projectPos').text()
            await this.project_view()
        });

        $(document).on('click', '#projectContent .check_task', (event) => {
            event.stopPropagation()
            let selected_goal = $(event.currentTarget).closest('.todo')
            this.change_project_check(selected_goal)
        });

        $(document).on('click', '#projectDelete', () => {
            $("#vignette").css('display', 'block')
            const delete_project_template = $('#deleteprojectTemplate').prop('content');
            let $delete_clone = $(delete_project_template).clone()
            $("#vignette").append($delete_clone)
        })

        $(document).on('click', '#deleteProjectCancel', () => {
            $('#vignette').html('')
            $('#vignette').css('display', 'none')
        })

        $(document).on('click', '#sideProjectGoals .check_task', (event) => {
            event.stopPropagation()
            this.check_sidebar_project_goal(event.currentTarget)
        })

        $(document).on('click', '#sideProjectClose', () => this.data.show_hide_sidebar(true, 1))

        $(document).on('click', '#dashNewProject', function () {
            $('#iconPicker').remove()
        })


    }

    /**
     * sets projects options on dashboard and sidebar
     * @param projects data of projects ,
     */
    set_projects_options() {
        let projects_HTML = ""
        let project_types_HTML = ""
        for (let i = 0; i < this.data.projects.length; i++) {
            let project_class = "dashProject"
            if (i % 2 === 0) project_class = "dashProject dashProjectRight"
            let icon_color = this.data.categories[this.data.projects[i].category][0]

            let icon_path = this.data.findPathByName(this.data.projects[i].icon)
            projects_HTML += this._dash_project_HTML(project_class, icon_color, icon_path, this.data.projects[i].name)
            project_types_HTML += this._type_project_HTML(icon_color, icon_path, this.data.projects[i].name)
        }

        projects_HTML += this._dash_add_project_HTML()
        $('#dashProjects').html(projects_HTML)
        $('#projectTypes').html(project_types_HTML)
    }


    /**
     * Builds new project based on given settings
     */
    new_project() {
        let project_setting_icon = $('#projectSettingsIcon')
        let category = Number($('.categoryDeciderId').text())
        console.log(category)
        let name = $('#newProjectName').val()

        let icon_path = $('#projectSettingIconSrc').attr('src')
        let icon_name = this.data.findNameByPath(icon_path);

        if (name === "") {
            $('#newProjectError').text("NO NAME GIVEN")
        } else if (icon_path === "images/goals/project.png") {
            $('#newProjectError').text("NO ICON SELECTED")
        } else if (category === 0) {
            $('#newProjectError').text("NO CATEGORY SELECTED")
        } else {
            window.projectsAPI.newProject({category: category, name: name, icon: icon_name})
            $('#vignette').css('display', 'none')
            this.data.projects.push({id: 0, name: name, category: category, icon: icon_name, x: null, y: null})
            this.set_projects_options()
        }
    }

    /**
     * Builds new project creation window
     */
    open_add_project() {
        $("#vignette").css('display', 'block')
        const new_project_template = $('#newProjectTemplate').prop('content');
        let $new_project_clone = $(new_project_template).clone()

        $new_project_clone.find('.categoryPicker').html(this.categories._categories_HTML())
        $("#vignette").html($new_project_clone)
    }

    async open_icon_picker() {
        if ($('#iconPicker').length === 0) {
            await this.data.loadIcons()
            const icon_picker_template = $('#iconPickerTemplate').prop('content');
            let $icon_picker_clone = $(icon_picker_template).clone()
            $("#projectSettingsIcon").append($icon_picker_clone)

            let $icon_picker_list = $('#iconPickerList')

            for (const key in this.data.merged_icons) {
                $icon_picker_list.append(`
                    <li class="iconPickerListElement">
                        <img src="${this.data.merged_icons[key]['path']}">
                    </li>`)
            }
        }
    }

    /**
     * Gets icon from user and changes it to white color
     * @param event change event of file uploading
     */
    async icon_upload(event) {
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
                        await this.data.loadIcons()

                    } else {
                        alert(`Error: ${result.error}`);
                    }
                };
            };

            reader.readAsDataURL(file);
        }
        $('#iconPicker').remove()
    }

    /**
     * event of selecting icon
     * @param that selected icon
     */
    select_icon(that) {
        let img_path = $(that).find('img').attr('src')

        $("#projectSettingIconSrc").attr('src', img_path)
        $('#iconPicker').remove()
    }

    /**
     * Displays project view
     */
    async project_view() {
        let project_color = $('.dashProjectIcon').eq(this.project_pos).css('background-color')
        let project_icon = $('.dashProjectIcon img').eq(this.project_pos).attr('src')
        let project_name = $('.dashProjectName').eq(this.project_pos).text()

        this.data.show_hide_sidebar(true, 1)
        this.set_project_view(project_color, project_icon, project_name)

        let goals = await window.goalsAPI.getProjectView({project_pos: this.project_pos})
        this.build_project_view(goals)

        this._set_input_category(project_color)
    }

    /**
     * BUild project view from templates
     */
    set_project_view(color, icon, name) {
        const header_template = $('#projectViewHeaderTemplate').prop('content');
        let $header_clone = $(header_template).clone()

        $header_clone.find('#projectHeader').css('background-color', color)
        $header_clone.find('#projectHeaderIcon').attr('src', icon)
        $header_clone.find('#projectName').text(name)
        $header_clone.find('#projectId').text(this.project_pos)

        const main_template = $('#projectViewMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()

        $main_clone.find('.projectSectionTitle').css('background-color', color)

        let categories_html = this.categories._categories_HTML()

        const input_template = $('#todoInputTemplate').prop('content');
        let $input_clone = $(input_template).clone()
        $input_clone.find('#categoryPicker1').html(categories_html)
        $('#main').html($header_clone)
        $('#main').append($main_clone)
        $('#projectContent').append($input_clone)
    }

    /**
     * sets default input category for project
     * @param project_color color of selected project
     */
    _set_input_category(project_color) {
        let category_id = getIdByColor(this.data.categories, project_color)
        let select_category = $('#selectCategory1')

        select_category.css('background-color', this.data.categories[category_id][0])
        select_category.text(this.data.categories[category_id][1])
    }


    /**
     * Builds project view using received goals data
     * Depending on goal type it goes to specific container
     * @param goals goals data
     */
    build_project_view(goals) {
        this.current_goal_id = 0
        for (let i = 0; i < goals.length; i++) {
            goals[i]['steps'] = this.steps._steps_HTML(goals[i].steps, goals[i].category)
            goals[i]['goal'] = decode_text(goals[i]['goal'])
            if (Number(goals[i]['check_state']) === 1) $('#projectDone .projectSectionGoals').append(this.build_project_goal(goals[i]))
            else if (goals[i]['addDate'] !== "") $('#projectDoing .projectSectionGoals').append(this.build_project_goal(goals[i]))
            else $('#projectTodo .projectSectionGoals').append(this.build_project_goal(goals[i]))
        }
        this.dragula_project_view()
    }

    /**
     * Drag and Drop for project view
     */
    dragula_project_view() {
        this.block_prev_drag = 0
        let dragged_task

        dragula(Array.from($('.projectSectionGoals')), {
            copy: () => {
                return true
            },
            accepts: (el, target) => {
                this.block_prev_drag = 0
                return $(target).parent().attr('id') !== "projectDoing";
            },
            moves: () => {
                if (this.block_prev_drag === 0) {
                    this.block_prev_drag = 1
                    return true
                } else return false
            },
        }).on('drag', (event) => {
            this.block_prev_drag = 0
            dragged_task = $(event)
        }).on('drop', (event) => {
            let drag_parent_id = dragged_task.closest('.projectSection').attr('id')
            let drop_parent_id = $(event).closest('.projectSection').attr('id')

            if (drag_parent_id !== 'projectDone' && drop_parent_id === 'projectDone') {
                let new_goal_pos = $('#projectDone .todo').index(event)
                this.move_to_done(new_goal_pos, dragged_task)
            } else if (drag_parent_id !== 'projectTodo' && drop_parent_id === 'projectTodo') {
                let new_goal_pos = $('#projectTodo .todo').index(event)
                this.move_to_todo(new_goal_pos, dragged_task)
            }
        })
    }

    /**
     * project goal type change to done by drag
     * @param new_goal_pos new position of moved goal
     * @param dragged_task pressed task
     */
    move_to_done(new_goal_pos, dragged_task) {

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
    move_to_todo(new_goal_pos, dragged_task) {
        let goal_id = $(dragged_task).find('.todoId').text()
        $(dragged_task).remove()
        window.goalsAPI.goalRemoveDate({id: goal_id})
        $('#projectTodo .checkDot').eq(new_goal_pos).css('background-image', ``)
        $('.check_task').eq(new_goal_pos).attr('checked', false)
    }

    /**
     * creates HTML of project goal
     * @param goal data of project goal
     * @returns {string} project goal in HTML format
     */
    build_project_goal(goal) {
        let todo_id = this.current_goal_id++
        let category_color = this.data.categories[goal.category][0]
        let check_state = goal.check_state ? "checked" : "";
        let check_bg = goal.check_state ? "url('images/goals/check.png')" : "";
        let url = `images/goals/rank${goal.difficulty}.svg`
        let already_emblem = goal.already ? this.data.already_emblem_HTML() : ""

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
     * Making html format of project option on dashboard
     * @param project_class defines if project is on the right side
     * @param icon_color color of the project option
     * @param icon icon name in path
     * @param name name of project
     * @returns {string} HTML format
     * @private
     */
    _dash_project_HTML(project_class, icon_color, icon_path, name) {
        return `
        <div class="${project_class}">
            <div class="dashProjectIcon" style="background-color: ${icon_color}">
                <img src="${icon_path}" alt="">
            </div>
            <span class="dashProjectName">${name}</span>
        </div>`
    }

    _dash_add_project_HTML() {
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
    _type_project_HTML(icon_color, icon, name) {
        return `
        <div class="projectType" style="background-color: ${icon_color}">
            <img class="projectTypeImg" src="${icon}" alt="">
            <div class="projectName" style="background-color: ${icon_color}">
                ${name}
            </div>
        </div>`
    }

    /**
     * changes check of project goal on checkbox click
     * @param that pressed checkbox of goal
     */
    change_project_check(selected_goal) {
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
        this.dragula_project_view()
    }

    /**
     * opens sidebar and displays project sidebar
     */
    async show_project_sidebar(that) {
        this.project_pos = $('.projectType').index(that)
        let project_color = $('.dashProjectIcon').eq(this.project_pos).css('background-color')
        let project_icon = $('.dashProjectIcon img').eq(this.project_pos).attr('src')
        let project_name = $('.dashProjectName').eq(this.project_pos).text()
        this.data.show_hide_sidebar(true, 0)

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
                <div id="sideProjectId">${this.project_pos}</div>
            </div>
            
            <div id="sideProjectsubTitle">To do</div>
            <div id="sideProjectGoals">
                
            </div>`)
        // <div id="sideProjectOptions">
        //     <div class="sideProjectOption">Done</div>
        // <div className="sideProjectOption">Doing</div>
        // <div className="sideProjectOption" style="background-color: ${project_color}">To do</div>
        // </div>
        let goals = await window.projectsAPI.askProjectSidebar({
            project_pos: this.project_pos,
            option: 2,
            current_dates: this.date.get_current_dates()
        })

        this.build_project_sidebar(goals)
    }

    build_project_sidebar(goals) {
        this.current_goal_id = 0
        let side_project_goals = $('#sideProjectGoals')
        side_project_goals.html("")

        for (let i = 0; i < goals.length; i++) {
            side_project_goals.append(this.build_project_goal(goals[i]))
        }

    }

    /**
     * changes type of displayed goals from project
     * @param that html element of selected sidebar project option
     */
    async change_sidebar_option(that) {
        let side_project_option = $('.sideProjectOption')
        let option = side_project_option.index(that)

        let color = $('.dashProjectIcon').eq(this.project_pos).css('background-color')
        side_project_option.css('background-color', '#2A231F')
        $(that).css('background-color', color)
        let goals = await window.projectsAPI.askProjectSidebar({
            project_pos: this.project_pos,
            option: option,
            current_dates: this.date.get_current_dates()
        })
        this.build_project_sidebar(goals)
    }

    check_sidebar_project_goal(selected_check) {
        let check_state = !$(selected_check).prop('checked')
        let goal_index = $('#sideProjectGoals .check_task').index(selected_check)

        let todo = $('#sideProjectGoals .todo').eq(goal_index)
        todo.remove()

        if (check_state) {
            window.goalsAPI.goalRemoveDate({id: goal_index, option: 1})
        } else {
            window.goalsAPI.changeChecksGoal({id: goal_index, state: 1, option: 1})
        }
    }

    /**
     * adds steps to the project from project sidebar
     * @param steps steps data
     * @param position position of dragged goal
     */
    get_goal_from_sidebar(steps, position) {
        this.change_order()
        let category = getIdByColor(this.data.categories, $('#main .todoCheck').eq(position).css('backgroundColor'))

        if ($('#todosAll').length) $('#main .taskText').eq(position).append(this.steps._steps_HTML(steps, category))
    }

    /**
     * fixes order of goals and saves it
     */
    change_order() {
        let goals = $('#main .todoId')
        if ($('#monthGrid').length) goals = $('#main .monthTodoId')
        let order = []
        for (let i = 0; i < goals.length; i++) order.push(goals.eq(i).text())

        window.goalsAPI.rowsChange({after: order})
    }

    async fix_project_sidebar(selected_button) {
        if ($('#sideProjectHeader').length) {
            let options = $('.sideProjectOption')
            let project_option
            let background_color = $('#sideProjectTitle').css("background-color")
            for (let i = 0; i < options.length; i++) {
                if (options.eq(i).css('background-color') === background_color) project_option = i
            }

            let goals = await window.projectsAPI.askProjectSidebar({
                project_pos: this.project_pos,
                option: project_option,
                current_dates: this.date.get_current_dates(selected_button)
            })
            this.build_project_sidebar(goals)
        }
    }
}

class Decider {
    constructor (app_data) {
        this.data = app_data
        this.sorted_projects = null

        this.initEventListeners()
    }

    initEventListeners(){
        $(document).on('click', '#projectDecider', () => {
            this.open()
        })

        $(document).on('click', '.projectDeciderProject', (event) =>{
            let selected_project_id = Number($(event.currentTarget).find('.projectDeciderProjectId').text())
            let project = this.data.projects.find(item => item.id === selected_project_id)

            let color = this.data.categories[project['category']][0]
            let icon_path = this.data.findPathByName(project['icon'])

            $('#projectDecider').css('background-color', color)
            $('#projectDeciderIcon img').attr('src', icon_path)
            $('#projectDeciderName').text(project['name'])
            $('#projectDeciderId').text(selected_project_id)
            $('#projectDeciderIcon img').css('display', 'block')
        })
    }

    /**
     * Sorts array bu categories order
     * @returns sorted projects array
     */
    get_sorted_projects_by_category() {
        this.sorted_projects = [...this.data.projects]
        let selected_category = Number($('#categoryDeciderId').text())

        this.sorted_projects.sort((a, b) => {
            const pinnedCategory = selected_category;

            if (a.category === pinnedCategory) return -1;
            if (b.category === pinnedCategory) return 1;

            return a.category - b.category;
        });
    }

    open(){
        this.get_sorted_projects_by_category()
        if($('#decisionMaker').length){
            if (!$("#projectDeciderSelect").length){
                let $decider = $(this.create_decider())
                let previous_category_id = 0

                const $decider_main = $decider.find('#projectDeciderMain')

                for (let i = 0; i < this.sorted_projects.length; i++) {
                    let current_category_id = this.sorted_projects[i]['category']
                    let category_settings = this.data.categories[this.sorted_projects[i]['category']]

                    if (current_category_id !== previous_category_id){
                        previous_category_id = current_category_id

                        $decider_main.append(this.create_category(category_settings))
                        $decider.find('.projectDeciderCategory').last().css('--before-color', category_settings[0]);
                    }

                    $decider.find('.projectDeciderCategory').last().append(this.create_project(this.sorted_projects[i], category_settings))
                }
                $('#decisionProject').append($decider)
            }

        }
    }

    create_decider(){
        return `
            <div id="projectDeciderSelect">
                <h2>Select Project</h2>
                <div id="projectDeciderMain">
    
                </div>
            </div>`
    }
    create_category(category_settings){
        return `
            <div class="projectDeciderCategory" style="border-color: ${category_settings[0]}">
                <h3 style="border-color: ${category_settings[0]}">${category_settings[1]}</h3>
            </div>`
    }

    create_project(sorted_project, category_settings){
        let icon_path = this.data.findPathByName(sorted_project['icon'])

        return `
            <div class="projectDeciderProject">
                <span class="projectDeciderProjectId">${sorted_project['id']}</span>
                <span class="projectDeciderProjectIcon" style="background-color: ${category_settings[0]}"> 
                    <img src="${icon_path}" alt>
                </span>
                <span class="projectDeciderProjectName">
                    ${sorted_project['name']}
                </span>
            </div>`
    }
}


