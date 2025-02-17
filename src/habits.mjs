

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
        })
    }
}