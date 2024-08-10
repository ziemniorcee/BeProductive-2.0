import { calculateContainment, categories, categories2, projects } from "./data.mjs";

$(document).on('click', '#strategy', function () {
    $('#galactics').css('display', 'block');
    add_galactic_category_boxes();
})

/**
 * Creates category windows in main galactic screen
 */
function add_galactic_category_boxes() {
    let galactics = '';
    const len = Object.keys(categories).length + 1;
    let counter = 0;
    const height = Math.floor(100 / Math.ceil(len / 5));
    $('<style>')
        .prop('type', 'text/css')
        .html(`.galacticBox {height: ${height}%; }`)
        .appendTo('head');
    for (const key in categories) {
        if (counter % 5 == 0) galactics += `<div class='galacticBox galacticBoxOdd'>`;
        else if (counter % 5 == 2) galactics += `<div class='galacticBox galacticBoxEven'>`;
        galactics += `<div class='galactic' id="galactic${key}" style='border-color: ${categories2[key]}'>`
        for (const proj of projects) {
            console.log(`${proj.category}, ${key}`)
            if (proj.category == key) {
                let h = (proj.y !== null) ? proj.y : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
                let w = (proj.x !== null) ? proj.x : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
                console.log(`${h},    ${w}`)
                galactics += `<div class="galactic-project-icon" id="galactic${key}Project-${proj.id}"
                style="top: ${h}%; left: ${w}%; border-color: ${categories[key][0]}; background-color: ${categories2[key]};"
                >${proj.name}</div>`
            }
        }
        galactics +=`<span class='galactic-text' style='color: ${categories2[key]}'>${categories[key][1]}</span></div>`
        if ((counter % 5 == 1) || (counter % 5 == 4)) galactics += `</div>`;
        
        counter++;
    }
    let box = $('#galacticContainer');
    box.empty();
    box.html(galactics);
}

$(document).on('click', '.galactic', function() {
    const match = $(this).attr('id').match(/\d+$/);
    const key = match ? parseInt(match[0], 10) : null;
    create_galactic_editor(key);
})


/**
 * Creates editor of certain galactic in galactics div.
 * @param {number} galactic - galactic window.
 * */
function create_galactic_editor(key) {
    let editor = `<div id="galactic-editor" style="border-color: ${categories[key][0]};">
    <span class='galactic-editor-text' style='color: ${categories2[key]}'>${categories[key][1]}</span>`;
    for (const proj of projects) {
        if (proj.category == key) {
            let h = (proj.y !== null) ? proj.y : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
            let w = (proj.x !== null) ? proj.x : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
            editor += `<div class="galactic-editor-project" id="galacticEditorProject${proj.id}"
            style="top: ${h}%; left: ${w}%; border-color: ${categories[key][0]}; background-color: ${categories2[key]};"
            >${proj.name}</div>`
        }
    }
    editor += `</div>`;
    let box = $('#galacticContainer');
    box.empty();
    box.html(editor);
    $('.galactic-editor-project').each(function(index, element) {
        $(element).draggable({
            containment: calculateContainment(element, $('#galactic-editor'), [0.1, 0.2, 0.1, 0.1]),
            stop: function(event, ui) {
                var position = ui.position;
                console.log("Pozycja elementu:", position);
            }
        })
    })

}