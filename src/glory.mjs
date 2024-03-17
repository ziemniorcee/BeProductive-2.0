import {show_hide_sidebar} from "./sidebar.mjs";
import {l_date} from "./date.js";
import {day_view} from "./render.mjs";
import {categories} from "./data.mjs";

$(document).on('click','#gloryButton', function (){
    let on_top_main = $('#onTopMain')
    show_hide_sidebar()

    $('#mainBlur').css('visibility', 'visible')
    on_top_main.css('visibility', 'visible')

    window.goalsAPI.askMonthGoals({dates: l_date.get_sql_month(), goal_check: 1})
})

$(document).on('click', "#mainBlur", function (){
    $('#mainBlur').css('visibility', 'hidden')
    $('#onTopMain').css('visibility', 'hidden')
    show_hide_sidebar()

    day_view()
})

window.goalsAPI.getMonthGoalsDone((goals_dict)=>{
    let vertical_lines_top = ""
    let vertical_lines_bottom = ""

    for(let i = 0; i <= 30; i++){
        if (i % 2===0) {
            vertical_lines_top += '<div class="vl"></div>'
            vertical_lines_bottom += `<div class="dayTimeline">${i+1 < 10?"0"+(i+1):i+1}</div>`
        }
        else {
            vertical_lines_top += `<div class="dayTimeline">${i+1 < 10?"0"+(i+1):i+1}</div>`
            vertical_lines_bottom += '<div class="vl"></div>'
        }
    }
    let columnsTop = ""
    let columnsBot = ""
    for(let i = 0; i <= 15; i++){
        let day = i*2+1

        let goals = ""
        if(goals_dict[day] !== undefined) {
            for (let j = 0; j < goals_dict[day].length; j++) {
                let url = `images/goals/glory${goals_dict[day][j].difficulty}.svg`
                goals += `<div class="gloryGoal" style='background: ${categories[goals_dict[day][j].category][0]}  url(${url})'></div>`
            }
        }

        columnsTop +=
            `<div class='gloryDay'>
                <div class="gloryGoals">
                    ${goals}
                </div>
            </div>`
    }

    for (let i = 0; i <= 14; i++){
        let day = i*2+2
        let goals = ""
        if(goals_dict[day] !== undefined) {
            for (let j = 0; j < goals_dict[day].length; j++) {
                let url = `images/goals/glory${goals_dict[day][j].difficulty}.svg`
                goals += `<div class="gloryGoal" style='background: ${categories[goals_dict[day][j].category][0]}  url(${url})'></div>`
            }
        }
        columnsBot +=
            `<div class='gloryDay'>
                <div class="gloryGoals">
                    ${goals}
                </div>
            </div>`
    }

    let glory_html=
        `<div id="gloryHead">
            <img src="images/goals/polaura.png" alt="polaura" width="25" height="50">
            <span>Hall of glory</span>
            <img src="images/goals/polaura2.png" alt="polaura" width="25" height="50">
        </div>
        <div id="gloryContent">
            <div id="gloryHalf1" class="gloryHalf">
                <div id="gloryHalfContentTop">
                    ${columnsTop}
                </div>
                <div id="verticalLinesTop">
                    ${vertical_lines_top}
                </div>
                <hr id="gloryTimeline">
            </div>
            <div id="gloryHalf2" class="gloryHalf">
                <div id="verticalLinesBottom">
                    ${vertical_lines_bottom}
                </div>
                <div id="gloryHalfContentBot">
                    ${columnsBot}
                </div>
            </div>
        </div>`

    $('#onTopMain').html(glory_html)


})