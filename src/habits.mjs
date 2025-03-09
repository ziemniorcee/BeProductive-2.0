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

        $(document).on('click', '#habit-today-save', () => {
            $('#habit-today-to-do').children().each((index, element) => {
                if ($(element).children(":last-child").is(':checked')) {
                    this.add_habit_log($(element).data('habit-to-do-id'))
                    let clone = $(element).clone()
                    clone.removeClass('habitToDo');
                    clone.children().last().remove();
                    $('#habit-today-done').append(clone);
                    $(element).remove();
                }
            });
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
            let name = $('#newHabitName').val();
            if (days.length > 0 && name !== "") {
                this.add_new_habit(name, 3, days);
                $('#vignette').css('display', 'none');
            }
        })

    }

    __HTML_habit_block(id, name, start_date, end_date, with_checkbox, opt_classes) {
        if (opt_classes === undefined) opt_classes = "";
        let habit_block = `<div class="habitBlocks habitHabit ${opt_classes}" data-habit-to-do-id="${id}"><span>${name}</span>`
        if (start_date && end_date) habit_block += `<span>${start_date} - ${end_date}</span>`
        if (with_checkbox) habit_block += '<input type="checkbox">'
        habit_block += '</div>'
        return habit_block
    }

    async add_new_habit(name, importancy, days) {
        let new_id = await window.goalsAPI.addHabit({name: name, importancy: importancy, days: days});
        new_id = new_id[0].id;
        window.goalsAPI.addHabitDays({id: new_id, days: days});
        this.data.habits.push({id: new_id, name: name, importancy: 3, days: days.slice()});
        console.log(this.data.habits);
    }

    async add_habit_log(id) {
        let today = new Date();
        const today_date = today.toISOString().split('T')[0];
        window.goalsAPI.addHabitLogs({id: id, date: today_date})
        this.data.habits_logs.push({habit_id: id, date: today_date})
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

    

    refresh_today_habits() {
        $('#habit-today-to-do').empty()
        $('#habit-today-done').empty()
        let today = new Date();
        const weekday = (today.getDay() + 6) % 7;
        const today_date = today.toISOString().split('T')[0];
        for (const habit of this.data.habits) {
            for (const day of habit.days) {
                if (day.day_of_week === weekday) {
                    let flag = true;
                    for (const log of this.data.habits_logs) {
                        if (log.habit_id === habit.id && log.date === today_date) {
                            flag = false;
                            let habit_block = this.__HTML_habit_block(habit.id, habit.name, 
                                day.start_date, day.end_date, false)
                            $('#habit-today-done').append(habit_block)
                        }
                    }
                    if (flag) {
                        let time_now = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                        if (!day.start_date || !day.end_date || 
                            (this.data.compare_times(day.start_date, time_now) > 0 && 
                            this.data.compare_times(time_now, day.end_date) > 0)) {
                            let habit_block = this.__HTML_habit_block(habit.id, habit.name,
                                day.start_date, day.end_date, true, "habitToDo")
                            $('#habit-today-to-do').append(habit_block)
                        }
                    }
                }
            }
        }
    }

    get_custom_time_data(element) {
        let hours = $(element).find('.customTimePickerHoursValue').first().text();
        let minutes = $(element).find('.customTimePickerMinutesValue').first().text();
        return hours + ":" + minutes;
    }

}