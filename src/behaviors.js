import {range1_backgrounds, range2_backgrounds} from "./data.mjs";


// #main behaviors
(function () {
    $(document).on('click', '#todoInput', (event) => {
        event.stopPropagation()
        $("#todoEntryComplex").css({"height": "250px", "visibility": "visible"});
        $("#todosAll").css({"height": "calc(100% - 315px)"});
    })

    $(document).on('click', '#main', () => {
        $("#repeatPicker").css({"display": "none"});
        $("#todoEntryComplex").css({"height": "0", "visibility": "hidden"});
        $("#todosAll").css({"height": "calc(100% - 65px)"});
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
        else $('#categoryPicker2').toggle()
    });

    $(document).on('click', '#main, #todoInput', function () {
        $('#categoryPicker').css('display', 'none')
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



$(document).on('click', '#rightbar', function () {
    $('#categoryPicker2').css('display', 'none')
})

$(document).on('click', '.viewOption', function () {
    $('.viewOption').css('borderColor', "black")
    $(this).css('borderColor', "#FFC90E")
})