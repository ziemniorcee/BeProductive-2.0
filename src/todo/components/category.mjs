
export class Categories {
    constructor(app) {
        this.initEventListeners()
        this.app = app
    }

    initEventListeners() {
        $(document).on('click', '#newCategoryCreate', () => {
            this.make_new_category()
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

        $(document).on('input', '#newCategoryColor', (event) => {
            let rgb = this.settings.data.hsvToRgb(event.currentTarget.value * 2, 0.7, 0.7);
            $('#newCategoryColor').css('background', `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
        })
    }

    make_new_category() {
        let name = $('#newCategoryName').val();
        if (name !== "") {
            this.create_new_category();
            let $vignette_layer = $('#newCategoryCreate').closest('.vignetteLayer')

            $("#newCategory").css('display', 'none');
            $vignette_layer.css('display', 'none');
            $vignette_layer.html('')

            let category_id = Object.keys(this.settings.data.categories.categories).at(-1)
            let category = this.settings.data.categories.categories[category_id]
            console.log(category)


            $('.categoryDecider').css('border-color', category[0])
            $('.categoryDeciderName').text(category[1])
            $('.categoryDeciderId').text(category_id)
            $(".categoryDeciderSelect").remove()
        } else {
            $('#newCategoryName').css('border', '3px solid red')
        }

        console.log(this.settings.data.categories.categories)
    }
    /**
     * Creates new category from newCategory box and resets categories pickers
     */
    create_new_category() {
        let rgb = this.settings.data.hsvToRgb($('#newCategoryColor').val() * 2, 0.7, 0.55);
        const len = Object.keys(this.settings.data.categories.categories).length + 1;
        let index = len;
        for (let i = 1; i < len; i++) {
            if (!(i in this.settings.data.categories.categories)) {
                index = i;
                break;
            }
        }
        let name = $('#newCategoryName').val();
        this.settings.data.categories.categories[index] = [`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, name];
        this.settings.data.categories.categories2[index] = `rgb(${Math.min(rgb[0] * 5 / 3, 255)}, 
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
            let category_element = Object.keys(this.settings.data.categories.categories)[index - 2]
            selected_category.css('background', this.settings.data.categories.categories[category_element][0])
            selected_category.text(this.settings.data.categories.categories[category_element][1])
        }
    }

    open_new_category() {
        let $selected_vignette = $("#vignette")
        if ($selected_vignette.css('display') === 'block') {
            $selected_vignette = $('#vignette2')
        }
        $selected_vignette.css('display', 'block')
        const add_category_template = $('#addCategoryTemplate').prop('content');
        let $add_category_clone = $(add_category_template).clone()

        $selected_vignette.html($add_category_clone)
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
        for (const id_key in this.settings.data.categories.categories) {
            categories_html +=
                `<div class="category">
                <span class="categoryButton" style="background: ${this.settings.data.categories.categories[id_key][0]}"></span>
                <span class="categoryName">${this.settings.data.categories.categories[id_key][1]}</span>
            </div>`
        }
        return categories_html
    }

    remove_category() {
        let category = this.settings.data.getIdByColor(this.settings.data.categories.categories, $('#selectCategory4').css('backgroundColor'))
        delete this.settings.data.categories.categories[category];
        let new_projects = this.settings.data.projects.projects.filter(item => item.category !== category);
        this.settings.data.projects.projects.splice(0, this.settings.data.projects.projects.length);
        for (let e of new_projects) {
            this.settings.data.projects.projects.push(e);
        }
        window.goalsAPI.removeCategory({id: category});
        $("#vignette").css('display', 'none');
        $("#vignette").html('')
        $("#categoryPicker1").html(this._categories_HTML(true))
    }
}

