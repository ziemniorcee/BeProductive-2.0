export class Habits {
    constructor (app_settings) {
        this.settings = app_settings;
        this.initEventListeners();
        this.chart = undefined;
        this.is_today = true;
        this.create_chart();
        console.log('lol')
    }

    initEventListeners() {

        $(document).on('input', '.customTimePickerHoursPicker', (e) => {
            console.log('hours')
            $(e.target).closest(".customTimePickerHours").children().first().text($(this).val());
        })

        $(document).on('input', '.customTimePickerMinutesPicker', (e) => {
            console.log('minutes')
            $(e.target).closest(".customTimePickerMinutes").children().first().text($(this).val().padStart(2, '0'));
        })

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

        $(document).on('click', '#habit-mode-today', (e) => {
            $('#habit-mode-tomorrow').css('display', 'block');
            $(e.target).css('display', 'none');
            this.is_today = true;
            $('#habit-mode-title').children('span').eq(0).text('today');
            this.refresh_today_habits();
        })

        $(document).on('click', '#habit-mode-tomorrow', (e) => {
            $('#habit-mode-today').css('display', 'block');
            $(e.target).css('display', 'none');
            this.is_today = false;
            $('#habit-mode-title').children('span').eq(0).text('tomorrow');
            this.refresh_tomorrow_habits();
        })

        $(document).on('click', '#newHabitCreate', async () => {
            let mode = $('input[name="newHabitPicker"]:checked').val();
            console.log(mode)
            let days = [];
            let start_date, end_date;
            for (let i=0; i<7; i++) {
                switch (mode) {
                    case '1':
                        days.push({day_of_week: i}); break;
                    case '2':
                        start_date = this.get_custom_time_data(
                            $('#newHabitOption2Box').children('.customTimePicker').eq(0))
                        end_date = this.get_custom_time_data(
                            $('#newHabitOption2Box').children('.customTimePicker').eq(1))
                        if (this.settings.data.compare_times(start_date, end_date) > 0) {
                            days.push({day_of_week: i, 
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
                            if (this.settings.data.compare_times(start_date, end_date) > 0) {
                                days.push({day_of_week: i, 
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
                            if (this.settings.data.compare_times(start_date, end_date) > 0) {
                                days.push({day_of_week: i, 
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
                await this.add_new_habit(name, 3, days);
                this.refresh_today_habits();
                $('#vignette').css('display', 'none');
            }
        });

        $(document).on('click', '.habitAllButton', (e) => {
            const id = $(e.target).parent().data('habit-id');
            if (id) {
                $("#vignette").css('display', 'block')
                const remove_habit_template = $('#removeHabitTemplate').prop('content');
                let $remove_habit_clone = $(remove_habit_template).clone()
                $remove_habit_clone.find("#removeHabitAccept").data('habit-id', parseInt(id));
                $("#vignette").html($remove_habit_clone)
            }
        })
        
        $(document).on('click', '#removeHabitAccept', async (e) => {
            let id = $(e.target).data('habit-id');
            if (id) {
                id = parseInt(id);
                await window.goalsAPI.removeHabit({id: id});
                this.settings.data.habits = this.settings.data.habits.filter(obj => obj.id !== id);
                this.settings.data.habits_logs = this.settings.data.habits_logs.filter(obj => obj.habit_id !== id);
                this.refresh_today_habits();
                $('#vignette').css('display', 'none');
            }
        })

        $(document).on('click', '#newHabitDiscard', () => {
            $("#newHabit").css('display', 'none');
            $("#vignette").css('display', 'none');
        })

        $(document).on('change', '.habitBlocksTodayCheckbox', async (e) => {
            let element = $(e.target).parent()
            let today = new Date();
            let date = today.toISOString().split('T')[0];
            let id = parseInt($(element).data('habit-id'));
            
            if ($(e.target).prop('checked')) {
                $(element).data('type', '3')
                $(element).children('.habitBlocksName').first().css('text-decoration', 'line-through');
                $(element).insertBefore($('#habit-new-btn'));
                await this.add_habit_log(id);
                console.log('checked')
            } else {
                $(element).data('type', '1')
                $(element).children('.habitBlocksName').first().css('text-decoration', 'none');
                $(element).prependTo('#habit-container');
                this.settings.data.habits_logs = this.settings.data.habits_logs.filter(
                    obj => !(obj.habit_id === id && obj.date === date));
                await window.goalsAPI.removeHabitLogs({id: id, date: date});
                console.log(this.settings.data.habits_logs)
                console.log('unchecked')
            }
        })
    }

    __HTML_habit_block(id, name, start_date, end_date, opt_button, type, opt_name_styles) {
        if (type === undefined) type = "";
        if (opt_name_styles === undefined) opt_name_styles = "";
        let habit_block = `<div class="habitBlocks" data-habit-id="${id}" data-type="${type}">
        <span class="habitBlocksName" style="${opt_name_styles}">${name}</span>`
        if (start_date && end_date) habit_block += `<span class="habitBlocksDate">${start_date} - ${end_date}</span>`
        if (opt_button) habit_block += '' + opt_button
        habit_block += '</div>'
        return habit_block
    }

    async add_new_habit(name, importancy, days) {
        let new_id = await window.goalsAPI.addHabit({name: name, importancy: importancy, days: days});
        new_id = new_id[0].id;
        await window.goalsAPI.addHabitDays({id: new_id, days: days});
        this.settings.data.habits.push({id: new_id, name: name, importancy: importancy, days: days.slice()});
        console.log(this.settings.data.habits);
    }

    async add_habit_log(id) {
        let today = new Date();
        const today_date = today.toISOString().split('T')[0];
        window.goalsAPI.addHabitLogs({id: id, date: today_date})
        this.settings.data.habits_logs.push({habit_id: id, date: today_date})
        console.log(this.settings.data.habits_logs)
    }

    create_new_habit_window() {
        $("#vignette").css('display', 'block')
        const new_habit_template = $('#addHabitTemplate').prop('content');
        let $new_habit_clone = $(new_habit_template).clone()
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
            <span>${this.settings.data.weekdays2[i]}</span>
            <input type="checkbox" id="newHabitOption3Day${i}">
            </div>`);
            $('#newHabitOption4Box').append(`<div class="newHabitOptionDayBox">
            <span>${this.settings.data.weekdays2[i]}</span>
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
        $('#habit-container').empty();
        let today = new Date();
        const weekday = (today.getDay() + 6) % 7;
        const today_date = today.toISOString().split('T')[0];
        let habits_to_do = "";
        let habits_later = "";
        let habits_done = "";
        for (const habit of this.settings.data.habits) {
            for (const day of habit.days) {
                if (day.day_of_week === weekday) {
                    let flag = true;
                    for (const log of this.settings.data.habits_logs) {
                        if (log.habit_id === habit.id && log.date === today_date) {
                            flag = false;
                            habits_done += this.__HTML_habit_block(habit.id, habit.name, 
                                day.start_date, day.end_date, 
                                '<input type="checkbox" class="habitBlocksTodayCheckbox" checked>', "3",
                                'text-decoration: line-through;'
                            )
                            break;
                        }
                    }
                    if (flag) {
                        let time_now = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                        if (!day.start_date || !day.end_date || 
                            (this.settings.data.compare_times(day.start_date, time_now) >= 0 && 
                            this.settings.data.compare_times(time_now, day.end_date) >= 0)) {
                            habits_to_do += this.__HTML_habit_block(habit.id, habit.name,
                                day.start_date, day.end_date, '<input type="checkbox" class="habitBlocksTodayCheckbox">', "1")
                        } else if (this.settings.data.compare_times(day.end_date, time_now) > 0) {
                            habits_later += this.__HTML_habit_block(habit.id, habit.name,
                                day.start_date, day.end_date, false, "2")
                        }
                    }
                } 
            }
        }
        $('#habit-container').append(habits_to_do);
        $('#habit-container').append(habits_later);
        $('#habit-container').append(habits_done);
        $('#habit-container').append('<div class="habitBlocks" id="habit-new-btn">New habit</div>');
    }

    refresh_tomorrow_habits() {
        $('#habit-container').empty();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekdayTomorrow = (tomorrow.getDay() + 6) % 7;
        for (const habit of this.settings.data.habits) {
            for (const day of habit.days) {
                if (day.day_of_week === weekdayTomorrow) {
                    let habit_block = this.__HTML_habit_block(habit.id, habit.name, 
                        day.start_date, day.end_date, false);
                    $('#habit-container').append(habit_block);
                }
            }
        }
        $('#habit-container').append('<div class="habitBlocks" id="habit-new-btn">New habit</div>');
    }

    get_custom_time_data(element) {
        let hours = $(element).find('.customTimePickerHoursValue').first().text();
        let minutes = $(element).find('.customTimePickerMinutesValue').first().text();
        return hours + ":" + minutes;
    }

    create_chart() {
        const $canvas = $("#habit-info-canv");
        const $parent = $canvas.parent();
        $canvas.attr("width", $parent.width());
        $canvas.attr("height", $parent.height());
        const ctx = document.getElementById('habit-info-canv').getContext('2d');
        const dni = ['2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06', '2025-05-07'];
        const procenty = [0.2, 0.5, 0.8, 0.6, 1.0, 0.7, 0.3];
        const data = {
            labels: dni,
            datasets: [{
            label: 'Percentage of completed habits',
            data: procenty,
            borderColor: 'green',
            backgroundColor: 'green',
            tension: 0.1,
            fill: false,
            pointRadius: 5
            }]
        };
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                animation: false,
                scales: {
                    x: {
                        ticks: {
                            color: 'white',
                            font: {
                            family: 'Courier New',
                            size: 12,
                            weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#ccc'
                        }
                        },
                    y: {
                        ticks: {
                            color: 'white',
                            font: {
                            family: 'Courier New',
                            size: 12,
                            weight: 'bold'
                            },
                            callback: value => `${Math.round(value * 100)}%`
                        },
                        grid: {
                            color: '#eee'
                        },
                        max: 1,
                        beginAtZero: true
                        }
                },
                plugins: {
                    customCanvasBackgroundColor: {
                        color: '#1E1E1E',
                    },
                    legend: {
                        labels: {
                            color: 'white',
                            font: {
                            family: 'Arial',
                            size: 14,
                            weight: 'bold'
                            }
                        },
                        onClick: null
                    }
                },
            }
        };
        this.chart = new Chart(ctx, config);
    }

    update_chart() {
        const result = [];
        const today = new Date();

        for (let i = 1; i <= 7; i++) {
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - i);

            const yyyy = pastDate.getFullYear();
            const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
            const dd = String(pastDate.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            const weekdayNumber = (pastDate.getDay() + 6) % 7;

            result.push([formattedDate, weekdayNumber]);
        }

        let quantities = [];
        let works = [];
        for (const [date, weekday] of result) {
            let quantity = 0;
            let work = 0;
            for (const habit of this.settings.data.habits) {
                let flag = false;
                for (const day of habit.days) {
                    if (weekday === day.day_of_week) {
                        quantity += 1
                        flag = true;
                        break;
                    }
                }
                if (flag) {
                    for (const log of this.settings.data.habits_logs) {
                        if (log.habit_id === habit.id && log.date === date) {
                            work += 1;
                        }
                    }
                }
            }
            quantities.push(quantity);
            works.push(work);
        }
        let days = [];
        for (const day of result) {
            days.push(day[0]);
        }
        days.reverse();
        quantities.reverse();
        works.reverse();
        let percentages = [];
        for (let i = 0; i < 7; i++) {
            percentages.push((quantities[i] == 0) ? 1.0 : works[i] / quantities[i]);
        }
        this.chart.data.labels = days;
        this.chart.data.datasets[0].data = percentages;
        this.chart.update();

    }

}