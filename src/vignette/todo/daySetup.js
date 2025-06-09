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
            this.category_check(event)
        })

        $(document).on('click', '.daySetupProjectCheck', (event) => {
            this.project_check(event)
        })

    }

    category_check(event) {
        event.stopPropagation()
        let is_category_checked = $(event.currentTarget).prop('checked')
        let $project_checkboxes = $(event.currentTarget).closest('.daySetupCategory').find('.daySetupProjectCheck')
        if (is_category_checked) {
            $project_checkboxes.prop('checked', true)
            $(event.currentTarget).closest('.daySetupCategory').find('.daySetupCategoryCheck').css({
                '--before-content': '"✖"',
            });
            if ($(event.currentTarget).closest('#daySetupPickerCategories').length) {
                for (let i = 0; i < $project_checkboxes.length; i++) {
                    let project_id = $project_checkboxes.eq(i).closest('.daySetupProject').data('project-id')
                    $('#daySetupQueueBody').append(this.templates.priority_project(project_id))
                }
            }

        } else {
            $project_checkboxes.prop('checked', false)
            if ($(event.currentTarget).closest('#daySetupPickerCategories').length) {
                for (let i = 0; i < $project_checkboxes.length; i++) {
                    let project_id = $project_checkboxes.eq(i).closest('.daySetupProject').data('project-id')
                    let $selected_project = $('.daySetupQueueProject').filter(function () {
                        return $(this).data('project-id') === project_id;
                    });
                    $selected_project.remove();
                    this.fix_ranks()
                }
            }
        }
    }

    project_check(event) {
        event.stopPropagation()
        let $target = $(event.currentTarget)
        let $project_checkboxes = $target.closest('.daySetupCategory').find('.daySetupProjectCheck')

        const checkedStates = $project_checkboxes.filter(':checked').length;

        let $category_checkbox = $target.closest('.daySetupCategory').find('.daySetupCategoryCheck')

        if (checkedStates === 0) {
            $category_checkbox.prop('checked', false);
            $category_checkbox.css({
                '--before-content': '"✖"',
            });
        } else if (checkedStates < $project_checkboxes.length) {
            $category_checkbox.prop('checked', true);
            $category_checkbox.css({
                '--before-content': '"⟋"',
            });
        } else {
            $category_checkbox.prop('checked', true);
            $category_checkbox.css({
                '--before-content': '"✖"',
            });
        }

        let project_id = $target.closest('.daySetupProject').data('project-id')

        if ($(event.currentTarget).closest('#daySetupPickerCategories').length) {
            if ($target.prop('checked')) {
                $('#daySetupQueueBody').append(this.templates.priority_project(project_id))
            } else {
                let $selected_project = $('.daySetupQueueProject').filter(function () {
                    return $(this).data('project-id') === project_id;
                });
                $selected_project.remove();
                this.fix_ranks()
            }
        }

    }

    async display() {
        let setup_settings = this.get_settings()
        $("#vignette").css('display', 'block')
        $("#vignette").append(await this.templates.vignette(setup_settings))
        this.fix_checkboxes()
        const $sliderPct = $('#daySetupShareSliderPct');
        this.templates.syncSliders($sliderPct);
        this.dragula_priorities()
    }

    fix_checkboxes() {
        let $categories = $('.daySetupCategory')
        for (let i = 0; i < $categories.length; i++) {
            let projects_length = $categories.eq(i).find('.daySetupProjectCheck').length
            let projects_checked = $categories.eq(i).find('.daySetupProjectCheck:checked').length

            let $category_checkbox = $categories.eq(i).find('.daySetupCategoryCheck')

            if (projects_checked === 0) {
                $categories.eq(i).find('.daySetupCategoryCheck').prop('checked', false)

            }
            else if (projects_checked === projects_length) {
                $categories.eq(i).find('.daySetupCategoryCheck').prop('checked', true)
                $category_checkbox.css({
                    '--before-content': '"✖"',
                });
            }
            else {
                $categories.eq(i).find('.daySetupCategoryCheck').prop('checked', true)
                $category_checkbox.css({
                    '--before-content': '"⟋"',
                });
            }
        }
    }

    get_settings() {
        let myDaySetup = {
            projectQueue: [],
            deadlines: [],
            project_share: 50,
            deadline_share: 50
        };
        const raw = localStorage.getItem(this.app.settings.data.localStorage);
        if (raw !== null) {
            try {
                myDaySetup = JSON.parse(raw);
            } catch (e) {
                console.error("Failed to parse myDaySetupState:", e);
            }
        }

        return myDaySetup;
    }

    dragula_priorities() {
        const drake = dragula(Array.from($('#daySetupQueueBody')), {
            moves: function (el, container, handle) {
                return handle.parentNode.classList.contains('daySetupQueueProjectDrag');
            }
        })

        drake.on('drop', (el, target, source, sibling) => {
            this.fix_ranks()
        });
    }

    save_setup() {
        const $projects = $('.daySetupQueueProject')
        const project_queue_ids = Array.from($projects).map(el => el.dataset.projectId);

        let $deadlines = $('#daySetupPickerDeadlines .daySetupProjectCheck:checked')
        let deadlines_ids = Array.from($deadlines).map(el => $(el).closest('.daySetupProject').data('todo-id'));

        let project_share = $('#daySetupShareSliderPct').val()
        let deadline_share = $('#daySetupShareSliderRemaining').val()

        const my_day_setup = {
            projectQueue: project_queue_ids,
            deadlines: deadlines_ids,
            project_share,
            deadline_share
        }
        try {
            localStorage[this.app.settings.data.localStorage] = JSON.stringify(my_day_setup);
        } catch (err) {
            console.error("❌ Failed to save setup to localStorage:", err);
        }
    }

    fix_ranks() {
        let $queue_ranks = $('.daySetupQueueProjectRank')
        for (let i = 0; i < $queue_ranks.length; i++) {
            $queue_ranks.eq(i).text(`${this.templates.arabic_to_roman(i + 1)}. `)
        }
    }
}

class DaySetupTemplates {
    constructor(app) {
        this.app = app

        this.bindEvents()
    }

    bindEvents() {
        $(document).on('click', '.daySetupShareSlider', () => {
            const $sliderPct = $('#daySetupShareSliderPct');
            this.syncSliders($sliderPct);
        });

        $(document).on('input', '#daySetupShareSliderPct', () => {
            const $sliderPct = $('#daySetupShareSliderPct');
            this.syncSliders($sliderPct)
        });

        $(document).on('input', '#daySetupShareSliderRemaining', () => {
            const $sliderRemaining = $('#daySetupShareSliderRemaining');
            this.syncSliders($sliderRemaining)
        });
    }


    syncSliders(changed) {
        const $sliderPct = $('#daySetupShareSliderPct');
        const $sliderRemaining = $('#daySetupShareSliderRemaining');
        const $labelPct = $('#daySetupSharePctValue');
        const $labelRemaining = $('#daySetupShareRemainingValue');

        const v = parseInt(changed.val(), 10);
        const ov = 100 - v;

        if (changed.is($sliderPct)) {
            $sliderRemaining.val(ov);
            $labelPct.text(v + '%');
            $labelRemaining.text(ov + '%');
        } else {
            $sliderPct.val(ov);
            $labelRemaining.text(v + '%');
            $labelPct.text(ov + '%');
        }

        [$sliderPct, $sliderRemaining].forEach($s => {
            const val = parseInt($s.val(), 10);
            $s.css('background',
                `linear-gradient(to right, var(--primary-color) ${val}%, var(--track-color) ${val}%)`
            );
        });
    }

    async vignette(setup_settings) {
        let categories_HTML = this.categories(setup_settings.projectQueue)
        let deadlines_HTML = await this.deadlines(setup_settings.deadlines)
        let priorities_HTML = this.priority(setup_settings.projectQueue)

        return `
            <div id='daySetup' class='vignetteWindow2'>
                <div id='daySetupHeader'>
                        My Day Setup
                </div>
                <div id="daySetupMainBody">
                    <div id="daySetupPicker">
                        <div id='daySetupPickerCategories'>
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
                        <div id='daySetupPickerDeadlines'>
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
                    </div>
                    <div id="daySetupPriorities">
                        <div id="daySetupQueue">
                            <div id="daySetupQueueTitle">
                                Projects Priority queue
                            </div>
                            <div id="daySetupQueueBody">
                                ${priorities_HTML}
                            </div>
                            
                        </div>
                        <div id="daySetupShare">
                            <div id="daySetupShareTitle">
                                Shares 
                            </div>
                            <div id="daySetupShareBodyPct">
                                <div class="daySetupShareSection">
                                    <div class="daySetupShareSectionTitle">
                                        Projects % share
                                    </div>
                                    <div class="daySetupShareSectionBody">
                                        <input
                                            type="range"
                                            id="daySetupShareSliderPct"
                                            class="daySetupShareSlider"
                                            min="0" max="100" value="${setup_settings.project_share}"
                                        >
                                        <span id="daySetupSharePctValue" class="daySetupShareValue">${setup_settings.project_share}%</span>
                                    </div>
                                </div>
                            </div>

                            <div id="daySetupShareBodyRemaining">
                                <div class="daySetupShareSection">
                                    <div class="daySetupShareSectionTitle">
                                        Deadlines % share
                                    </div>
                                    <div class="daySetupShareSectionBody">
                                        <input
                                            type="range"
                                            id="daySetupShareSliderRemaining"
                                            class="daySetupShareSlider"
                                            min="0" max="100" value="${setup_settings.deadline_share}"
                                        >
                                        <span id="daySetupShareRemainingValue" class="daySetupShareValue">${setup_settings.deadline_share}%</span>
                                    </div>
                                </div>
                            </div>
                        </div> 
                        
                    </div>
                </div>
            </div>`
    }


    categories(setup_categories) {
        let categories_HTML = ""

        let categories = this.app.settings.data.categories.categories
        let projects = this.app.settings.data.projects.projects

        for (const key in categories) {
            let category_id = Number(key)
            let category_name = categories[key][1]
            let category_color = categories[key][0]
            let projects_in_category = projects.filter(project => project.category === category_id)
            if (projects_in_category.length) {
                let projects_HTML = this.projects(projects_in_category, setup_categories)

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

    projects(projects, setup_categories) {
        let projects_HTML = ""

        for (let i = 0; i < projects.length; i++) {
            let check = ""
            if (setup_categories.includes(`${projects[i].id}`)) {
                check = "checked"
            }
            let project_id = projects[i].id
            let project_name = projects[i].name
            projects_HTML += `<div class="daySetupProject" data-project-id="${project_id}">
                                <input type="checkbox" class="daySetupProjectCheck" ${check}>
                                ${project_name}
                             </div>`
        }
        return projects_HTML
    }

    async deadlines(setup_deadlines) {
        let deadlines_HTML = ""

        let goals = await window.goalsAPI.getDeadlines({date: this.app.settings.date.today_sql})

        if (goals.length === 0) return deadlines_HTML

        let previous_date = goals[0]['addDate']

        let goals_HTML = ""
        for (let i = 0; i < goals.length; i++) {
            let check = ""
            if (setup_deadlines.includes(Number(goals[i].id))) {
                check = "checked"
            }
            if (i === goals.length - 1) goals_HTML += this.date(goals[i], check)

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
                goals_HTML += this.date(goals[i], check)
            } else {
                goals_HTML += this.date(goals[i], check)
            }
        }

        return deadlines_HTML
    }

    date(goal, check) {
        return `<div class="daySetupProject" data-todo-id="${goal['id']}">
                    <input type="checkbox" class="daySetupProjectCheck" ${check}>
                    ${goal['goal']}
                </div>`
    }

    priority(setup_projects) {
        let projects = this.app.settings.data.projects.projects
        let categories = this.app.settings.data.categories.categories
        let priorities_HTML = ""
        for (let i = 0; i < setup_projects.length; i++) {

            if (projects.some(item => item.id === Number(setup_projects[i]))) {
                let project = projects.find(project => project.id === Number(setup_projects[i]))
                let color = categories[project.category][0]
                priorities_HTML += `<div class="daySetupQueueProject" data-project-id="${setup_projects[i]}">
                                    <div class="daySetupQueueProjectDrag">
                                        <img src="images/goals/drag.png" alt="">
                                    </div>
                                    <div class="daySetupQueueProjectRank" style="border-left: 3px solid ${color}">
                                        ${this.arabic_to_roman(i + 1)}.
                                    </div>
                                    <div class="daySetupQueueProjectName">
                                        ${project.name}
                                    </div>
                                </div>`
            }

        }
        return priorities_HTML
    }

    hasAnyMatch(items, idsToCheck) {
        const idSet = new Set(items.map(item => String(item.id)));
        return idsToCheck.some(id => idSet.has(id));
    }

    priority_project(project_id) {
        let projects = this.app.settings.data.projects.projects
        let categories = this.app.settings.data.categories.categories

        let project = projects.find(project => project.id === project_id)
        let color = categories[project.category][0]

        let index = $('.daySetupQueueProject').length + 1
        return `<div class="daySetupQueueProject" data-project-id="${project_id}">
                    <div class="daySetupQueueProjectDrag">
                        <img src="images/goals/drag.png" alt="">
                    </div>
                    <div class="daySetupQueueProjectRank" style="border-left: 3px solid ${color}">
                        ${this.arabic_to_roman(index)}.
                    </div>
                    <div class="daySetupQueueProjectName">
                        ${project.name}
                    </div>
                </div>`
    }

    arabic_to_roman(num) {
        if (num <= 0 || num >= 4000) {
            throw new RangeError('Liczba musi być w przedziale 1–3999');
        }

        const romanNumerals = [
            {value: 1000, symbol: 'M'},
            {value: 900, symbol: 'CM'},
            {value: 500, symbol: 'D'},
            {value: 400, symbol: 'CD'},
            {value: 100, symbol: 'C'},
            {value: 90, symbol: 'XC'},
            {value: 50, symbol: 'L'},
            {value: 40, symbol: 'XL'},
            {value: 10, symbol: 'X'},
            {value: 9, symbol: 'IX'},
            {value: 5, symbol: 'V'},
            {value: 4, symbol: 'IV'},
            {value: 1, symbol: 'I'}
        ];

        let result = '';

        for (const {value, symbol} of romanNumerals) {
            const count = Math.floor(num / value);
            if (count > 0) {
                result += symbol.repeat(count);
                num -= value * count;
            }
        }

        return result;
    }
}