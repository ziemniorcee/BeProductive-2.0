export class Habits {
    constructor (app_data, app_categories) {
        this.data = app_data;
        this.categories = app_categories;
        this.initEventListeners();
    }

    initEventListeners() {
        $(document).on('click', '#habit-new-btn', () => {
            $("#vignette").css('display', 'block')
            const new_habit_template = $('#addHabitTemplate').prop('content');
            let $new_habit_clone = $(new_habit_template).clone()
            $new_habit_clone.find(".categoryPicker").html(this.categories._categories_HTML(false, true))
            $("#vignette").html($new_habit_clone)
            this.categories.select_category($('#categoryPicker5').children().first());
        })

        $(document).on('change', 'input[name="newHabitPicker"]', () => {
            let val = $('input[name="newHabitPicker"]:checked').val();
            console.log(val)
            for (let i=2; i<5; i++) {
                if ("" + i === val) $(`#newHabitOption${i}`).css('display', 'flex');
                else $(`#newHabitOption${i}`).css('display', 'none');
            } 
        })


    }
}