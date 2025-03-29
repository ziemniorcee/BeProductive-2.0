import {getIdByColor, hsvToRgb, projects} from "./data.mjs";

export class Categories {
    constructor(app_data) {
        this.initEventListeners()
        this.data = app_data

        this.decider = new Decider(app_data)
    }

    initEventListeners() {
        $(document).on('click', '#newCategoryCreate', () => {
            let name = $('#newCategoryName').val();
            if (name !== "") {
                this.create_new_category();
                let $vignette_layer = $('#newCategoryCreate').closest('.vignetteLayer')

                $("#newCategory").css('display', 'none');
                $vignette_layer.css('display', 'none');
                $vignette_layer.html('')

                let category_element = Object.keys(this.data.categories).at(-1)
                $('#selectCategory22').css('background', this.data.categories[category_element][0])
                $('#selectCategory22').text(this.data.categories[category_element][1])
            } else {
                $('#newCategoryName').css('border', '3px solid red')
            }
        })

        $(document).on('click', '#newCategoryDiscard', () => {
            $("#newCategory").css('display', 'none');
            $("#vignette").css('display', 'none');
            $('#vignette').html('')
        });

        $(document).on('click', '.category', (event) => {
            event.stopPropagation();
            this.select_category(event.currentTarget)
        });


    }

    /**
     * Creates new category from newCategory box and resets categories pickers
     */
    create_new_category() {
        let rgb = hsvToRgb($('#newCategoryColor').val() * 2, 0.7, 0.55);
        const len = Object.keys(this.data.categories).length + 1;
        let index = len;
        for (let i = 1; i < len; i++) {
            if (!(i in this.data.categories)) {
                index = i;
                break;
            }
        }
        let name = $('#newCategoryName').val();
        this.data.categories[index] = [`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, name];
        this.data.categories2[index] = `rgb(${Math.min(rgb[0] * 5 / 3, 255)}, 
                            ${Math.min(rgb[1] * 5 / 3, 255)}, 
                            ${Math.min(rgb[2] * 5 / 3, 255)})`;

        window.goalsAPI.addCategory({id: index, name: name, r: rgb[0], g: rgb[1], b: rgb[2]});
        $('#newCategoryName').val('');
        let html_categories = this._categories_HTML();
        for (let i of ['1', '22', '3', '4']) {
            $(`#categoryPicker${i}`).empty();
            $(`#categoryPicker${i}`).html(html_categories);
            if ($(`#categoryPicker${i}`).css('display') === 'block') {
                $(`#selectCategory${i}`).css('background', `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
                $(`#selectCategory${i}`).text(name);
                $(`#categoryPicker${i}`).css('display', 'none');
            }
        }

    }


    /**
     * Checks which category picker and by cetegory id it sets category selection
     * @param that selected category
     */
    select_category(that) {
        let index = $(that).closest('.categoryPicker').find('.category').index(that) + 1

        let picker_id = $(that).closest('.categoryPicker').attr('id')
        const id = picker_id.match(/categoryPicker(\d+)/)[1];

        if (id === '4') index++
        if (id === '3') index++

        if (index === 1) {
            let $selected_vignette = $("#vignette")
            if ($selected_vignette.css('display') === 'block') {
                $selected_vignette = $('#vignette2')
            }
            $selected_vignette.css('display', 'block')
            const add_category_template = $('#addCategoryTemplate').prop('content');
            let $add_category_clone = $(add_category_template).clone()

            $selected_vignette.html($add_category_clone)
        } else if (id !== '0') {
            let selected_category = $(`#selectCategory${id}`)
            $(`#categoryPicker${id}`).css('display', 'none')
            let category_element = Object.keys(this.data.categories)[index - 2]
            selected_category.css('background', this.data.categories[category_element][0])
            selected_category.text(this.data.categories[category_element][1])
        }
    }


    /**
     * creates categories for goals
     * @returns {string} HTML of categories
     */
    _categories_HTML(with_new_category) {
        let categories_html = ""
        if (with_new_category === undefined) {
            categories_html +=
                `<div class="category">
                <span class="categoryButton" style="background: rgb(93, 93, 93)"></span>
                <span class="categoryName">New Category</span>
            </div>`
        }
        for (const id_key in this.data.categories) {
            categories_html +=
                `<div class="category">
                <span class="categoryButton" style="background: ${this.data.categories[id_key][0]}"></span>
                <span class="categoryName">${this.data.categories[id_key][1]}</span>
            </div>`
        }
        return categories_html
    }

    remove_category() {
        let category = getIdByColor(this.data.categories, $('#selectCategory4').css('backgroundColor'))
        delete this.data.categories[category];
        let new_projects = projects.filter(item => item.category !== category);
        projects.splice(0, projects.length);
        for (let e of new_projects) {
            projects.push(e);
        }
        window.goalsAPI.removeCategory({id: category});
        $("#vignette").css('display', 'none');
        $("#vignette").html('')
        $("#categoryPicker1").html(this._categories_HTML(true))
    }
}

class Decider {
    constructor(app_data) {
        this.data = app_data

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
                category = this.data.categories[selected_category_id]
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

            for (let category in this.data.categories) {
                let category_settings = this.data.categories[category]
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
