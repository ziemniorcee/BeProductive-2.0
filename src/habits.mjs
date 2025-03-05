export class Habits {
    constructor (app_data, app_categories) {
        this.data = app_data;
        this.categories = app_categories;
        this.initEventListeners();
    }

    initEventListeners() {
        $(document).on('click', '#habit-new-btn', () => {
            this.create_new_habit_window();
        })

        $(document).on('change', 'input[class="newHabitOption4Checkbox"]', (e) => {
            $(e.target).parent().children(".customTimePicker").toggle()
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
            let mode = $('input[name="newHabitPicker"]:checked').val();
            console.log(mode)
            let days = [];
            let start_date, end_date;
            for (let i=0; i<7; i++) {
                switch (mode) {
                    case '1':
                        days.push({day: i}); break;
                    case '2':
                        start_date = this.get_custom_time_data(
                            $('#newHabitOption2Box').children('.customTimePicker').eq(0))
                        end_date = this.get_custom_time_data(
                            $('#newHabitOption2Box').children('.customTimePicker').eq(1))
                        console.log(start_date);
                        console.log(end_date)
                        if (this.data.compare_times(start_date, end_date) > 0) {
                            days.push({day: i, 
                                start_date: start_date,
                                end_date: end_date
                            }); 
                        }
                        break;
                    case '3':
                        if ($(`#newHabitOption3Day${i}`).prop('checked')) {
                            start_date = this.get_custom_time_data(
                                $('#newHabitOption3TimeBox').children('.customTimePicker').eq(0))
                            end_date = this.get_custom_time_data(
                                $('#newHabitOption3TimeBox').children('.customTimePicker').eq(1))
                            console.log(start_date);
                            console.log(end_date)
                            if (this.data.compare_times(start_date, end_date) > 0) {
                                days.push({day: i, 
                                    start_date: start_date,
                                    end_date: end_date
                                }); 
                            }
                        }
                        break;
                    case '4':
                        if ($(`#newHabitOption4Day${i}`).prop('checked')) {
                            start_date = this.get_custom_time_data(
                                $(`#newHabitOption4Day${i}`).parent().children('.customTimePicker').eq(0))
                            end_date = this.get_custom_time_data(
                                $(`#newHabitOption4Day${i}`).parent().children('.customTimePicker').eq(1))
                            console.log(start_date);
                            console.log(end_date);
                            if (this.data.compare_times(start_date, end_date) > 0) {
                                days.push({day: i, 
                                    start_date: start_date,
                                    end_date: end_date
                                }); 
                            }
                        }
                        break;
                }
            }
            if (days.length > 0) {
                this.add_new_habit("lol", 3, days);
                $('#vignette').css('display', 'none');
            }
        })

    }

    async add_new_habit(name, importancy, days) {
        let new_id = await window.goalsAPI.addHabit({name: name, importancy: importancy, days: days});
        new_id = new_id[0].id;
        window.goalsAPI.addHabitDays({id: new_id, days: days});
        this.data.habits.push({id: new_id, name: name, importancy: 3});
        days.forEach(day => {
            let new_day = {...day, habit_id: new_id};
            this.data.habits_days.push(new_day);
        });
        console.log(this.data.habits);
        console.log(this.data.habits_days);
    }

    create_new_habit_window() {
        $("#vignette").css('display', 'block')
        const new_habit_template = $('#addHabitTemplate').prop('content');
        let $new_habit_clone = $(new_habit_template).clone()
        $new_habit_clone.find(".categoryPicker").html(this.categories._categories_HTML(false, true))
        $("#vignette").html($new_habit_clone)
        const time_picker_template = $('#customTimePicker').prop('content');
        $('#newHabitOption2').children("#newHabitOption2Box").append($(time_picker_template).clone());
        $('#newHabitOption2').children("#newHabitOption2Box").append('<span style="margin:10px"> - </span>')
        $('#newHabitOption2').children("#newHabitOption2Box").append($(time_picker_template).clone());
        $('#newHabitOption3').children("#newHabitOption3TimeBox").append($(time_picker_template).clone());
        $('#newHabitOption3').children("#newHabitOption3TimeBox").append('<span style="margin:10px"> - </span>')
        $('#newHabitOption3').children("#newHabitOption3TimeBox").append($(time_picker_template).clone());
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
            for (let j=0; j<2; j++) {
                $(last_box).append($(time_picker_template).clone());
                $(last_box).children(":last-child").css('display', 'none');
            } 
        }
    }

    get_custom_time_data(element) {
        let hours = $(element).find('.customTimePickerHoursValue').first().text();
        let minutes = $(element).find('.customTimePickerMinutesValue').first().text();
        return hours + ":" + minutes;
    }

}