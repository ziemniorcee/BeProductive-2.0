export class NewProject {
    constructor(app) {
        this.app = app
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', "#projectSettingIconSrc", async () => await this.open_icon_picker())

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
        let project_setting_icon = $('#projectSettingsIcon')
        let category_id = Number($('#dashNewProject').find('.categoryDeciderId').text())
        let name = $('#newProjectName').val()

        let icon_path = $('#projectSettingIconSrc').attr('src')
        let icon_name = this.app.settings.data.projects.findNameByPath(icon_path);

        if (name === "") {
            $('#newProjectError').text("NO NAME GIVEN")
        } else if (icon_path === "images/goals/project.png") {
            $('#newProjectError').text("NO ICON SELECTED")
        } else if (category_id === 0) {
            $('#newProjectError').text("NO CATEGORY SELECTED")
        } else {
            let new_project = await window.projectsAPI.newProject({category: category_id, name: name, icon: "ebe"})

            this.app.settings.data.projects.projects.push({id: new_project["id"], name: name, category: category_id, icon: "ebe", x: null, y: null})
            await this.make_project_icon(new_project["id"], category_id)

            let $selected_vignette = $("#vignette2")
            if ($selected_vignette.css('display') !== 'block') {
                $selected_vignette = $('#vignette')
            } else {
                setTimeout(() => {
                    let color = this.app.settings.data.categories.categories[category_id][0]
                    let new_icon_path = this.app.settings.data.projects.get_project_icon_path(new_project["id"])

                    console.log(new_icon_path)
                    $('.projectDecider').css('border', `2px solid ${color}`)
                    $('.projectDeciderIcon img').attr('src', new_icon_path)
                    $('.projectDeciderName').text(name)
                    $('.projectDeciderId').text(new_project["id"])
                    $('.projectDeciderIcon img').css('display', 'block')
                    $('.projectDeciderSelect').remove()
                }, 0)
            }
            $selected_vignette.css('display', 'none')
        }
    }

    async make_project_icon(project_id, category_id) {
        let category = this.app.settings.data.categories.categories[category_id]
        let category_rgb = category[0]
        const [var_r, var_g, var_b] = category_rgb.match(/\d+/g).map(Number);

        let name = $('#newProjectName').val()

        let icon_path = $('#projectSettingIconSrc').attr('src')
        let icon_name = this.app.settings.data.projects.findNameByPath(icon_path);

        const img = new Image();
        img.src = icon_path;
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const pixels = imageData.data;

            for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i + 3] > 0) {
                    pixels[i] = var_r;   // Red
                    pixels[i + 1] = var_g; // Green
                    pixels[i + 2] = var_b; // Blue
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const processedImageSrc = canvas.toDataURL();

            const base64Data = processedImageSrc.split(',')[1];
            const fileName = `project${project_id}.png`;

            let result = await window.electronAPI.saveFile(fileName, base64Data, "project_icons");
            await this.app.settings.data.projects.loadProjectIcons()
            this.app.settings.data.projects.set_projects_options()
        }
    }

    async open_icon_picker() {
        if ($('#iconPicker').length === 0) {
            await this.app.settings.data.projects.loadIcons()
            const icon_picker_template = $('#iconPickerTemplate').prop('content');
            let $icon_picker_clone = $(icon_picker_template).clone()
            $("#projectSettingsIcon").append($icon_picker_clone)

            let $icon_picker_list = $('#iconPickerList')

            for (const key in this.app.settings.data.projects.merged_icons) {
                $icon_picker_list.append(`
                    <li class="iconPickerListElement">
                        <img src="${this.app.settings.data.projects.merged_icons[key]['path']}">
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

                    const result = await window.electronAPI.saveFile(fileName, base64Data, "icons");
                    $('#projectSettingIconSrc').attr('src', result['path']);
                    if (result.success) {
                        await this.app.settings.data.projects.loadIcons()

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
}
