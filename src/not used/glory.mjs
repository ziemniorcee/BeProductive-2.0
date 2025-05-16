import {categories, month_names} from "./data.mjs";

$(document).on('click','#gloryButton', function (){
    let on_top_main = $('#onTopMain')
    show_hide_sidebar()

    $('#mainBlur').css('visibility', 'visible')
    on_top_main.css('visibility', 'visible')

    window.goalsAPI.askMonthGoals({dates: l_date.glory_month, goal_check: 1})
})

$(document).on('click', "#mainBlur", function (){
    $('#mainBlur').css('visibility', 'hidden')
    $('#onTopMain').css('visibility', 'hidden')
    show_hide_sidebar()

    day_view()
})

$(document).on('click', '#prevMonth', function (){
    l_date.glory_prev_month()
    window.goalsAPI.askMonthGoals({dates: l_date.glory_month, goal_check: 1})
})

$(document).on('click', '#nextMonth', function (){
    l_date.glory_next_month()
    window.goalsAPI.askMonthGoals({dates: l_date.glory_month, goal_check: 1})
})

window.goalsAPI.getMonthGoalsDone((goals_dict)=>{ // updated handler, needs return
    build_glory(goals_dict)
})

function build_glory(goals_dict){
    let vls = _build_vls()
    let columnsTop = _build_columns(goals_dict, 15, 1)
    let columnsBot = _build_columns(goals_dict, 14, 2)

    let glory_html=
        `<div id="gloryHead">
            <div id="glorySetup">
                <div id="prevMonth" class="gloryChangeMonth"><img src="../images/goals/arrow0.png" alt=""></div>
                <div id="gloryFormat"><div id="gloryFormatText">Month</div></div>
                <div id="gloryCurrentSetup"></div>
                <div id="nextMonth" class="gloryChangeMonth"><img src="../images/goals/arrow1.png" alt=""></div>
            </div>
            <div>
                <img src="../images/goals/polaura.png" alt="polaura" width="25" height="50">
                <span>Hall of glory</span>
                <img src="../images/goals/polaura.png" class="polaura2" alt="polaura" width="25" height="50">
            </div>
        </div>
        <div id="gloryContent">
            <div id="gloryHalf1" class="gloryHalf">
                <div id="gloryHalfContentTop">
                    ${columnsTop}
                </div>
                <div id="verticalLinesTop">
                    ${vls[0]}
                </div>
                <hr id="gloryTimeline">
            </div>
            <div id="gloryHalf2" class="gloryHalf">
                <div id="verticalLinesBottom">
                    ${vls[1]}
                </div>
                <div id="gloryHalfContentBot">
                    ${columnsBot}
                </div>
            </div>
        </div>`

    $('#onTopMain').html(glory_html)
    $('#gloryCurrentSetup').text(month_names[l_date.get_glory_month()])
}

function _build_vls(){
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
    return [vertical_lines_top, vertical_lines_bottom]
}

function _build_columns(goals_dict, days, start){
    let columns = ""

    for(let i = 0; i <= days; i++){
        let day = i*2+start
        let goals = ""
        if(goals_dict[day] !== undefined) {
            for (let j = 0; j < goals_dict[day].length; j++) {
                console.log(goals_dict[day][j])
                let url = `images/goals/glory${goals_dict[day][j].difficulty}.svg`
                goals += `<div class="gloryGoal" style='background: ${categories[goals_dict[day][j].category][0]}  url(${url}) center'></div>`
            }
        }

        columns +=
            `<div class='gloryDay'>
                <div class="gloryGoals">
                    ${goals}
                </div>
            </div>`
    }

    return columns
}