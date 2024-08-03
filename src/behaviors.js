import {range1_backgrounds, range2_backgrounds, hsvToRgb} from "./data.mjs";


// #main behaviors
(function () {
    $(document).on('click', '#todoInput', (event) => {
        event.stopPropagation()
        $("#todoEntryComplex").css({"height": "250px", "visibility": "visible"});
        $("#todosAll").css({"height": "calc(100% - 315px)"});
        $('.projectSectionGoals').css({"height": "calc(100% - 315px)"})
    })

    $(document).on('click', '#main', () => {
        $("#repeatPicker").css({"display": "none"});
        $("#todoEntryComplex").css({"height": "0", "visibility": "hidden"});
        $("#todosAll").css({"height": "calc(100% - 65px)"});
        $('.projectSectionGoals').css({"height": "calc(100% - 65px)"})
    })

    $(document).on('click', '.dateButton', function () {
        $(".dateButton").css("border-color", "black")
        $(this).css("border-color", "#FFC90E")
    })

    $(document).on('click', '#todoRepeat', (event) => {
        event.stopPropagation()
        $("#repeatPicker").toggle()
    })

    $(document).on('click', '.selectCategory', function (event) {
        event.stopPropagation()
        if ($(this).attr('id') === "selectCategory") $('#categoryPicker').toggle()
        else if ($(this).attr('id') === "selectCategory2") $('#categoryPicker2').toggle()
        else if ($(this).attr('id') === "selectCategory3") $('#categoryPicker3').toggle()
    });

    $(document).on('click', '#main, #todoInput', function () {
        $('#categoryPicker').css('display', 'none')
        $('#categoryPicker3').css('display', 'none')
        $('#newProjectIconPicker').css("visibility", "hidden")
    })

    $(document).on('click', '#finishedButton', () => {
        const finished_img = $('#finishedImg')
        let show = finished_img.attr('src') === "images/goals/up.png"
        $('#todosFinished').css('display', show ? "block" : "none")
        finished_img.attr('src', show ? "images/goals/down.png" : "images/goals/up.png")
    })

    $(document).on('input', '#range1, #editDiff', function () {
        $(this).css('background', range1_backgrounds[this.value])
    })

    $(document).on('input', '#range2, #editImportance', function () {
        $(this).css('background', range2_backgrounds[this.value])
    })
})();

$(document).on('click', '#dashClose, #dashOpen', () => {
    $('#dashboard').toggle()
    $('#dashOpen').toggle();
})


$(document).on('click', '#rightbar', function () {
    $('#categoryPicker2').css('display', 'none')
})

$(document).on('click', '#rightbar', function () {
    $('#editProjectPicker').css('display', 'none')
})

$(document).on('click', '#dashNewProjectContent', function (){
    $('#categoryPicker3').css('display', 'none')
    $('#newProjectIconPicker').css("visibility", "hidden")
})

$(document).on('click', "#projectSettingsIcon", function (event){
    event.stopPropagation()
    let icon_picker = $('#newProjectIconPicker')
    let state = icon_picker.css("visibility") === "hidden"
    icon_picker.css("visibility", state ? 'visible' : "hidden")
})

$(document).on('click', '.dashViewOption', function (){
    $('.dashViewOption').css('backgroundColor', '#55423B')
    $(this).css('backgroundColor', '#FF5D00')
})

$(document).on('click', '#dashWeek', function () {
    $('#content').css('flexDirection', 'row')
});

$(document).on('input', '#newCategoryColor', function () {
    let rgb = hsvToRgb(this.value * 2, 0.7, 0.7);
    $('#newCategoryColor').css('background', `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
})
