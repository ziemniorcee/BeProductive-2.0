export class NewProject {
    constructor(app) {
        this.app = app
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', "#projectSettingIconSrc", async () => await this.open_icon_picker())
        $(document).on('click', "#projectSettingsIcon svg", async () => await this.open_icon_picker())

        $(document).on('click', '#iconUpload', (event) => event.stopPropagation())


        $(document).on('change', '#iconUpload', async (event) => await this.icon_upload(event))

        $(document).on('click', '.iconPickerListElement', (event) => this.select_icon(event.currentTarget))

        $(document).on('click', '#newProjectCreate', async () => this.new_project())

        $(document).on('click', '#newProjectDiscard', () => {
            $('#vignette').css('display', 'none')
        })

        $(document).on('click', '#dashNewProject', function () {
            $('#iconPicker').remove()
        })

        $(document).on('click', '#dashboardStrategyAddProject', async () => {
            this.open()
        })

        $(document).on('click', '#dashNewProjectContent', function (){
            $('#newProjectIconPicker').css("visibility", "hidden")
        })
    }

    open() {
        $("#vignette").css('display', 'block')
        const add_project_template = $('#newProjectTemplate').prop('content');
        let $add_project_clone = $(add_project_template).clone()

        $("#vignette").html($add_project_clone);
    }

    /**
     * Builds new project based on given settings
     */
    async new_project() {
        let category_id = $('#dashNewProject').find('.categoryDeciderId').text()
        let name = $('#newProjectName').val()

        let icon_id = await $('#projectSettingsIcon').attr('data-icon')
        console.log(icon_id)
        if (name === "") {
            $('#newProjectError').text("NO NAME GIVEN")
        } else if (icon_id === '0') {
            $('#newProjectError').text("NO ICON SELECTED")
        } else if (category_id === '0') {
            $('#newProjectError').text("NO CATEGORY SELECTED")
        } else {
            await this.app.services.data_poster('new-project', {name: name, category: category_id, icon: icon_id})
            await this.app.settings.data.projects.init()
            this.app.controller.init()

            let $selected_vignette = $("#vignette2")
            if ($selected_vignette.css('display') !== 'block') {
                $selected_vignette = $('#vignette')
            } else {
                setTimeout(() => {
                    let color = this.app.settings.data.categories.categories[category_id][0]
                    let new_icon_path = this.app.settings.data.projects.get_project_icon_path(new_project["id"])

                    $('.projectDecider').css('border', `2px solid ${color}`)
                    $('.projectDeciderIcon img').attr('src', new_icon_path)
                    $('.projectDeciderName').text(name)
                    $('.projectDeciderId').text(new_project["id"])
                    $('.projectDeciderIcon img').css('display', 'block')
                    $('.projectDeciderSelect').remove()
                }, 0)
            }
            $selected_vignette.css('display', 'none')

            setTimeout(() => {
                let is_less = $('#dashStrategyMore').text() === 'Less'
                this.app.controller.appDashboard.projects.build(is_less)
            }, 0)
        }
    }


    async open_icon_picker() {
        if ($('#iconPicker').length === 0) {
            let icon_picker_template = await $('#iconPickerTemplate').prop('content');
            let $icon_picker_clone =  $(icon_picker_template).clone()
            $("#projectSettingsIcon").append($icon_picker_clone)

            let $icon_picker_list = $('#iconPickerList')
            for (const key in this.app.settings.data.projects.icons) {
                $icon_picker_list.append(`
                    <li class="iconPickerListElement" data-icon="${this.app.settings.data.projects.icons[key]['id']}">
                        ${this.app.settings.data.projects.icons[key]['svg']}
                    </li>`)
            }
        }
    }

    /**
     * Gets icon from user and changes it to white color
     * @param event change event of file uploading
     */

    /**
     * event of selecting icon
     * @param that selected icon
     */
    select_icon(that) {
        let img_path = $(that).html()
        console.log(img_path)
        let icon_id = $(that).attr('data-icon')
        $("#projectSettingsIcon").html(img_path)
        $('#iconPicker').remove()
        $('#projectSettingsIcon').attr('data-icon', icon_id)
    }
}
