import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {weekdays2} from "./data.mjs";

$(document).on('click', '#viewMonth', function () {
    $('#content').css('flexDirection', 'column')

    $('#todayButton .dateButtonText').text('This month')
    $('#tomorrowButton .dateButtonText').text('Next month')
    $('#otherButton .dateButtonText').text('More months')

    show_hide_sidebar(true)
    let html = ""

    let header = ""
    for (let i = 0; i< 7; i++){
        header += `
            <div class="monthWeekDay">
                ${weekdays2[i]}
            </div>`
    }

    let grid = ""
    for (let i = 0; i < 5; i++){
        let week = ""
        for (let j = 0; j < 7; j++){
            week += `
                <div class="monthDay">
                    
                </div>
            `
        }
        grid += `
            <div class="monthWeek">
                ${week}
            </div>
        `
    }

    $('#content').html(`
        <div id="monthHeader">
            ${header}
        </div>
        <div id="monthGrid">
            ${grid}
        </div>
    `)
})