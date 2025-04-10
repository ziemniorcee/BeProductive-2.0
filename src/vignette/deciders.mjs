export class Deciders {
    constructor(app_settings) {
        this.settings = app_settings
        this.project = new ProjectDecider(app_settings)
        this.category = new CategoryDecider(app_settings)
        this.initEventListeners()
    }

    initEventListeners() {

    }
}

class CategoryDecider {
    constructor(app_settings) {
        this.settings = app_settings

        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', '.categoryDecider', () => {
            this.open()
        })

        $(document).on('click', '.categoryDeciderCategory', (event) => {
            let selected_category_id = Number($(event.currentTarget).find('.categoryDeciderCategoryId').text())
            let category = ['rgb(74, 74, 74)', 'No category']

            if (selected_category_id !== 0) {
                category = this.settings.data.categories.categories[selected_category_id]
            }


            $("body").get(0).style.setProperty("--decide-color", category[0]);

            $('.categoryDecider').css('border-color', category[0])
            $('.categoryDeciderName').text(category[1])
            $('.categoryDeciderId').text(selected_category_id)

            $(".categoryDeciderSelect").remove()
        })
    }

    open() {
        if (!$(".categoryDeciderSelect").length) {
            let $decider = $(this.create_decider())

            $decider.find('.categoryDeciderCategories').append(this.create_category(['rgb(74, 74, 74)', 'No category'], 0))

            for (let category in this.settings.data.categories.categories) {
                let category_settings = this.settings.data.categories.categories[category]
                $decider.find('.categoryDeciderCategories').append(this.create_category(category_settings, category))
            }
            $('.categoryDecider').after($decider)
        } else {
            $(".categoryDeciderSelect").remove()
        }
    }

    create_decider() {
        return `
            <div class="categoryDeciderSelect">
                <h2>Select Category</h2>
                <div class="categoryDeciderCategories">
    
                </div>
            </div>`
    }

    create_category(category_settings, category_id) {
        return `
            <div class="categoryDeciderCategory">
                <div class="categoryDeciderCategoryId">${category_id}</div>
                <div class="categoryDeciderCategoryColor" style="background-color: ${category_settings[0]}"></div>
                <span>${category_settings[1]}</span>
            </div>`
    }
}


class ProjectDecider {
    constructor (app_settings) {
        this.app_settings = app_settings
        this.sorted_projects = null

        this.initEventListeners()
    }

    initEventListeners(){
        $(document).on('click', '.projectDecider', () => {
            console.log("CHUJ")
            this.open()
        })

        $(document).on('click', '.projectDeciderProject', (event) =>{

            let selected_project_id = Number($(event.currentTarget).find('.projectDeciderProjectId').text())
            let project = this.app_settings.data.projects.projects.find(item => item.id === selected_project_id)

            let color = this.app_settings.data.categories.categories[project['category']][0]
            let icon_path = this.app_settings.data.projects.findProjectPathByName(`project${project['id']}`)

            $('.projectDecider').css('border', `2px solid ${color}`)
            $('.projectDeciderIcon img').attr('src', icon_path)
            $('.projectDeciderName').text(project['name'])
            $('.projectDeciderId').text(selected_project_id)
            $('.projectDeciderIcon img').css('display', 'block')
            $(".projectDeciderSelect").remove()
        })
    }

    /**
     * Sorts array bu categories order
     * @returns sorted projects array
     */
    get_sorted_projects_by_category() {
        this.sorted_projects = [...this.app_settings.data.projects.projects]
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
        if (!$(".projectDeciderSelect").length){
            let $decider = $(this.create_decider())
            let previous_category_id = 0

            const $decider_main = $decider.find('#projectDeciderMain')

            for (let i = 0; i < this.sorted_projects.length; i++) {
                let current_category_id = this.sorted_projects[i]['category']
                let category_settings = this.app_settings.data.categories.categories[this.sorted_projects[i]['category']]

                if (current_category_id !== previous_category_id){
                    previous_category_id = current_category_id

                    $decider_main.append(this.create_category(category_settings))
                    $decider.find('.projectDeciderCategory').last().css('--before-color', category_settings[0]);
                }

                $decider.find('.projectDeciderCategory').last().append(this.create_project(this.sorted_projects[i], category_settings))
            }
            $('.projectDecider').after($decider)
        }else {
            $(".projectDeciderSelect").remove()
        }
    }

    create_decider(){
        return `
            <div class="projectDeciderSelect">
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
        let icon_path = this.app_settings.data.projects.findProjectPathByName(`project${sorted_project['id']}`)

        return `
            <div class="projectDeciderProject">
                <span class="projectDeciderProjectId">${sorted_project['id']}</span>
                <span class="projectDeciderProjectIcon" > 
                    <img src="${icon_path}" alt>
                </span>
                <span class="projectDeciderProjectName">
                    ${sorted_project['name']}
                </span>
            </div>`
    }
}