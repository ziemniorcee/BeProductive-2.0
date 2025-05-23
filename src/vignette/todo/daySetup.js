export class DaySetup {
    constructor(app) {
        this.app = app
        this.templates = new DaySetupTemplates(app)
        this.bindEvents()
    }

    bindEvents() {
        $(document).on('click', '#MyDaySetup', async () => {
            await this.display()
        })

        $(document).on('click', '.daySetupSectionTitle', (event) => {
            $(event.currentTarget).closest('.daySetupSection').find('.daySetupSectionBody').toggle()

            if ($(event.currentTarget).find('img').attr('src') === 'images/goals/down.png') {
                $(event.currentTarget).find('img').attr('src', 'images/goals/up.png')
            } else {
                $(event.currentTarget).find('img').attr('src', 'images/goals/down.png')
            }
        })

        $(document).on('click', '.daySetupCategoryTitle', (event) => {
            $(event.currentTarget).closest('.daySetupCategory').find('.daySetupCategoryBody').toggle()
            if ($(event.currentTarget).find('img').attr('src') === 'images/goals/down.png') {
                $(event.currentTarget).find('img').attr('src', 'images/goals/up.png')
            } else {
                $(event.currentTarget).find('img').attr('src', 'images/goals/down.png')
            }
        })

        $(document).on('click', '.daySetupCategoryCheck', (event) => {
            event.stopPropagation()
            let is_category_checked = $(event.currentTarget).prop('checked')
            let $project_checkboxes = $(event.currentTarget).closest('.daySetupCategory').find('.daySetupProjectCheck')
            if (is_category_checked) {
                $project_checkboxes.prop('checked', true)
                $(event.currentTarget).closest('.daySetupCategory').find('.daySetupCategoryCheck').css({
                    '--before-content': '"✖"',
                });
            } else {
                $project_checkboxes.prop('checked', false)
            }
        })

        $(document).on('click', '.daySetupProjectCheck', (event) => {
            event.stopPropagation()
            let $project_checkboxes = $(event.currentTarget).closest('.daySetupCategory').find('.daySetupProjectCheck')

            const checkedStates = $project_checkboxes.filter(':checked').length;

            let $category_checkbox = $(event.currentTarget).closest('.daySetupCategory').find('.daySetupCategoryCheck')

            if (checkedStates === 0) {
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').prop('checked', false);
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').css({
                    '--before-content': '"✖"',
                });
            } else if (checkedStates < $project_checkboxes.length) {
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').prop('checked', true);
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').css({
                    '--before-content': '"⟋"',
                });
            } else {
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').prop('checked', true);
                $category_checkbox.closest('.daySetupCategory').find('.daySetupCategoryCheck').css({
                    '--before-content': '"✖"',
                });
            }
        })

    }

    async display() {
        $("#vignette").css('display', 'block')
        $("#vignette").append(await this.templates.vignette())
    }
}

class DaySetupTemplates {
    constructor(app) {
        this.app = app
    }

    async vignette() {
        let categories_HTML = this.categories()
        let deadlines_HTML = await this.deadlines()

        return `
            <div id='daySetup' class='vignetteWindow2'>
                <div id='daySetupHeader'>
                    My Day Setup
                </div>
                <div id='daySetupBody'>
                    <div class="daySetupSection">
                        <div class="daySetupSectionTitle">
                            <img src="images/goals/down.png" alt="">
                            Categories
                        </div>
                        <div class="daySetupSectionBody">
                            ${categories_HTML}
                        </div>
                    </div>
                </div>
                <div id='daySetupBody'>
                    <div class="daySetupSection">
                        <div class="daySetupSectionTitle">
                            <img src="images/goals/down.png" alt="">
                            Upcoming deadlines
                        </div>
                        <div class="daySetupSectionBody">
                            ${deadlines_HTML}
                        </div>
                    </div>
                </div>
            </div>`
    }

    categories() {
        let categories_HTML = ""

        let categories = this.app.settings.data.categories.categories
        let projects = this.app.settings.data.projects.projects

        for (const key in categories) {
            let category_id = Number(key)
            let category_name = categories[key][1]
            let category_color = categories[key][0]
            let projects_in_category = projects.filter(project => project.category === category_id)
            if (projects_in_category.length) {
                let projects_HTML = this.projects(projects_in_category)

                categories_HTML += `<div class="daySetupCategory" style="border-color: ${category_color}">
                                <div class="daySetupCategoryTitle">
                                    <img src="images/goals/down.png" alt="">
                                    <input type="checkbox" class="daySetupCategoryCheck">
                                    ${category_name}
                                </div>
                                <div class="daySetupCategoryBody">
                                    ${projects_HTML}
                                </div>
                            </div>`
            }
        }
        return categories_HTML
    }

    projects(projects) {
        let projects_HTML = ""

        for (let i = 0; i < projects.length; i++) {
            let project_id = projects[i].id
            let project_name = projects[i].name
            let project_icon = projects[i].icon
            projects_HTML += `<div class="daySetupProject">
                                <input type="checkbox" class="daySetupProjectCheck">
                                ${project_name}
                             </div>`
        }
        return projects_HTML
    }

    async deadlines() {
        let deadlines_HTML = ""

        let goals = await window.goalsAPI.getDeadlines({date: this.app.settings.date.today_sql})

        if (goals.length === 0) return deadlines_HTML

        let previous_date = goals[0]['addDate']

        let goals_HTML = ""
        for (let i = 0; i < goals.length; i++) {
            if ( i === goals.length - 1) goals_HTML += this.date(goals[i])

            if (previous_date !== goals[i]['addDate'] || i === goals.length - 1) {

                deadlines_HTML += `<div class="daySetupCategory">
                                <div class="daySetupCategoryTitle">
                                    <img src="images/goals/down.png" alt="">
                                    <input type="checkbox" class="daySetupCategoryCheck">
                                    ${previous_date}
                                </div>
                                <div class="daySetupCategoryBody">
                                    ${goals_HTML}
                                </div>
                            </div>`
                goals_HTML = ""
                previous_date = goals[i]['addDate']
                goals_HTML += this.date(goals[i])
            }
            else {
                goals_HTML += this.date(goals[i])
            }
        }

        return deadlines_HTML
    }

    date(goal) {
        return `<div class="daySetupProject">
                                <input type="checkbox" class="daySetupProjectCheck">
                                ${goal['goal']}
                             </div>`
    }
}