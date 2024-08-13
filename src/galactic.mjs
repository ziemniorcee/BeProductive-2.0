import { calculateContainment, categories, categories2, projects, project_conn, extractNumbers } from "./data.mjs";

let clicked_project = '';

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
    <svg id="galactic-editor-canv" width="100%" height="100%" preserveAspectRatio="none"></svg>
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
            cursorAt: {left: 0, top: 0},
            containment: calculateContainment(element, $('#galactic-editor'), [0.1, 0.2, 0.1, 0.1]),
            scroll: false,
            stop: function(event, ui) {
                var position = ui.position;
                console.log("Pozycja elementu:", position);
            }
        })
        $(element).on('mousedown', function (event) {
            if (event.button === 2) {
                clicked_project = $(element).attr('id');
            }
        })
        $(element).on('mouseup', function (event) {
            if (event.button === 2) {
                let released_project = $(element).attr('id');
                console.log(`${clicked_project}, ${released_project}`)
                if (released_project !== clicked_project) {
                    let conn = [extractNumbers(clicked_project)[0], extractNumbers(released_project)[0]];
                    conn.sort();
                    if ($(`#galactic-editor-line${conn[0]}-${conn[1]}`).length) ;
                    else {
                        let offset1 = $(`#${clicked_project}`).offset();
                        let offset2 = $(`#${released_project}`).offset();
                        let line = document.createElementNS('http://www.w3.org/2000/svg','line');
                        line.setAttribute('x1', offset1.left - $(`#${clicked_project}`).outerWidth() / 2);
                        line.setAttribute('y1', offset1.top + $(`#${clicked_project}`).outerHeight() / 2);
                        line.setAttribute('x2', offset2.left - $(`#${released_project}`).outerWidth() / 2);
                        line.setAttribute('y2', offset2.top + $(`#${released_project}`).outerHeight() / 2);
                        line.setAttribute('stroke', categories2[key]);
                        line.setAttribute('stroke-width', 8);
                        $("#galactic-editor-canv").append(line);
                    }
                    project_conn.push([conn[0], conn[1]])
                }
            }
        })
    })

}