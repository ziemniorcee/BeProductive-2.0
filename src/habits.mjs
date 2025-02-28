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
            const time_picker_template = $('#customTimePicker').prop('content');
            $('#newHabitOption2').children(":first-child").html($(time_picker_template).clone());
            $('#newHabitOption3').append($(time_picker_template).clone());
            for (let i=0; i<7; i++) {
                $('#newHabitOption3Box').append(`<div class="newHabitOptionDayBox">
                <span>${this.data.weekdays2[i]}</span>
                <input type="checkbox" id="newHabitOption3Day${i}">
                </div>`);
                $('#newHabitOption4Box').append(`<div class="newHabitOptionDayBox">
                <span>${this.data.weekdays2[i]}</span>
                <input type="checkbox" id="newHabitOption4Day${i}" class="newHabitOption4Checkbox">
                </div>`);
                let last_box = $('#newHabitOption4Box').children(":last-child")
                $(last_box).append($(time_picker_template).clone());
                $(last_box).children(":last-child").css('display', 'none');
            }
        })

        $(document).on('change', 'input[class="newHabitOption4Checkbox"]', (e) => {
            $(e.target).parent().children(".customTimePicker").first().toggle()
        })

        $(document).on('change', 'input[name="newHabitPicker"]', () => {
            let val = $('input[name="newHabitPicker"]:checked').val();
            console.log(val)
            for (let i=2; i<5; i++) {
                if ("" + i === val) $(`#newHabitOption${i}`).css('display', 'flex');
                else $(`#newHabitOption${i}`).css('display', 'none');
            }
        })

        $(document).on('click', '#newHabit', (event) => {
            //category picker closing
            if (!$(event.target).closest('.categoryDecider').length && !$(event.target).closest('.categoryDeciderSelect').length) {
                $(".categoryDeciderSelect").remove()
            }
        })

        $(document).on('click', '#newHabitCreate', () => {
            this.add_new_habit("lol", 3, []);
            $('#vignette').css('display', 'none');
        })

    }

    async add_new_habit(name, importancy, days) {
        let new_habit_id = await window.goalsAPI.addHabit({name: name, importancy: importancy, days: days});
        console.log(new_habit_id[0]);
    }

}