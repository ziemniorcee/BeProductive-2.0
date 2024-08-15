import { calculateContainment, categories, categories2, projects, project_conn, extractNumbers, calculateChildPosition } from "./data.mjs";

let clicked_project = '';
let changes_lines = [];
let changes_projects = [];
let connections = [];

$(document).on('click', '#strategy', function () {
    for (let conn of project_conn) {
        connections.push(conn['from'], conn['to']);
    }
    $('#galactics').css('display', 'block');
    add_galactic_category_boxes();
    $('#galactic-editor').remove();
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
    <span id="galactic-editor-text" style='color: ${categories2[key]}'>${categories[key][1]}</span>
    <div id="galactic-editor-confirm"
    style="border-color: ${categories[key][0]}; background-color: ${categories2[key]}; color: ${categories[key][0]};">Confirm</div>`;
    
    for (const proj of projects) {
        if (proj.category == key) {
            let h = (proj.y !== null) ? proj.y : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
            let w = (proj.x !== null) ? proj.x : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
            editor += `<div class="galactic-editor-project" id="galacticEditorProject${proj.id}" data-project-number="${proj.id}"
            style="top: ${h}%; left: ${w}%; border-color: ${categories[key][0]}; background-color: ${categories2[key]};"
            >${proj.name}</div>`
        }
    }
    editor += `</div>`;
    let box = $('#galacticContainer');
    box.empty();
    box.html(editor);
    
    for (let conn of project_conn) {
        if (conn['project'] === key) {
            let pos1 = $(`#galacticEditorProject${conn['from']}`).position();
            let pos2 = $(`#galacticEditorProject${conn['to']}`).position();
            let line = document.createElementNS('http://www.w3.org/2000/svg','line');
            line.setAttribute('class', `galactic-editor-line`);
            line.setAttribute('id', `galactic-editor-line${conn['from']}-${conn['to']}`);
            line.setAttribute('x1', pos1.left + $(`#galacticEditorProject${conn['from']}`).outerWidth() / 2);
            line.setAttribute('y1', pos1.top + $(`#galacticEditorProject${conn['from']}`).outerHeight() / 2);
            line.setAttribute('x2', pos2.left + $(`#galacticEditorProject${conn['to']}`).outerWidth() / 2);
            line.setAttribute('y2', pos2.top + $(`#galacticEditorProject${conn['to']}`).outerHeight() / 2);
            line.setAttribute('stroke', categories2[key]);
            line.setAttribute('stroke-width', 8);
            $("#galactic-editor-canv").append(line);
        }
    }

    $(document).on('click', '#galactic-editor-confirm', function () {
        console.log(changes_lines);
        console.log(changes_projects);
    })

    $(document).on('mousemove', '#galactic-editor', function (event) {
        if (clicked_project !== '') {
            let line = document.getElementById('galactic-editor-line-moving');
            if (line) {
                let offset = $(this).offset();
                line.x2.baseVal.value = event.pageX - offset.left;
                line.y2.baseVal.value = event.pageY - offset.top;
            } 
        }
    })

    $(document).on('mouseup', '#galactic-editor', function () {
        $('#galactic-editor-line-moving').remove();
        clicked_project = '';
    })

    $('.galactic-editor-project').each(function(index, element) {

        $(element).draggable({
            cursorAt: {left: 0, top: 0},
            containment: calculateContainment(element, $('#galactic-editor'), [0.1, 0.2, 0.1, 0.1]),
            scroll: false,
            start: function(event, ui) {
                console.log($(element).data('project-number'));
            },
            drag: function(event, ui) {
                let number = $(element).data('project-number');
                for (let conn of connections) {
                    if (conn[0] == number) {
                        let line = document.getElementById(`galactic-editor-line${conn[0]}-${conn[1]}`);
                        let pos = $(element).position();
                        line.x1.baseVal.value = pos.left + $(element).outerWidth() / 2;
                        line.y1.baseVal.value = pos.top + $(element).outerHeight() / 2;
                    }
                    else if (conn[1] == number) {
                        let line = document.getElementById(`galactic-editor-line${conn[0]}-${conn[1]}`);
                        let pos = $(element).position();
                        line.x2.baseVal.value = pos.left + $(element).outerWidth() / 2;
                        line.y2.baseVal.value = pos.top + $(element).outerHeight() / 2;
                    }
                }
            },
            stop: function(event, ui) {
                let n = $(element).data('project-number');
                let position = calculateChildPosition(element, $('#galactic-editor'));
                let flag = true;
                for (let i = 0; i < changes_projects.length; i++) {
                    if (changes_projects[i].id === n) {
                        flag = false;
                        changes_projects[i].x = Math.floor(position.x);
                        changes_projects[i].y = Math.floor(position.y);
                    }
                }
                if (flag) changes_projects.push({'id': n, 'x': Math.floor(position.x), 'y': Math.floor(position.y)});
            }
        })

        $(element).on('mousedown', function (event) {
            if (event.button === 2) {
                clicked_project = $(element).attr('id');
                let pos = $(element).position();
                let line = document.createElementNS('http://www.w3.org/2000/svg','line');
                line.setAttribute('id', 'galactic-editor-line-moving');
                line.setAttribute('x1', pos.left + $(element).outerWidth() / 2);
                line.setAttribute('y1', pos.top + $(element).outerHeight() / 2);
                line.setAttribute('x2', pos.left + $(element).outerWidth() / 2);
                line.setAttribute('y2', pos.top + $(element).outerHeight() / 2);
                line.setAttribute('stroke', categories2[key]);
                line.setAttribute('stroke-width', 8);
                $("#galactic-editor-canv").append(line);
            }
        })

        $(element).on('mouseup', function (event) {
            if (event.button === 2) {
                let released_project = $(element).attr('id');
                console.log(`${clicked_project}, ${released_project}`)
                if (released_project !== clicked_project) {
                    let conn = [$(`#${clicked_project}`).data('project-number'), $(element).data('project-number')];
                    conn.sort();
                    if ($(`#galactic-editor-line${conn[0]}-${conn[1]}`).length) ;
                    else {
                        let proj1 = `#galacticEditorProject${conn[0]}`;
                        let proj2 = `#galacticEditorProject${conn[1]}`;
                        let pos1 = $(proj1).position();
                        let pos2 = $(proj2).position();
                        let line = document.createElementNS('http://www.w3.org/2000/svg','line');
                        line.setAttribute('class', `galactic-editor-line`)
                        line.setAttribute('id', `galactic-editor-line${conn[0]}-${conn[1]}`)
                        line.setAttribute('x1', pos1.left + $(proj1).outerWidth() / 2);
                        line.setAttribute('y1', pos1.top + $(proj1).outerHeight() / 2);
                        line.setAttribute('x2', pos2.left + $(proj2).outerWidth() / 2);
                        line.setAttribute('y2', pos2.top + $(proj2).outerHeight() / 2);
                        line.setAttribute('stroke', categories2[key]);
                        line.setAttribute('stroke-width', 8);
                        $("#galactic-editor-canv").append(line);
                        changes_lines.push({'project': key, 'from': conn[0], 'to': conn[1]});
                        connections.push([conn[0], conn[1]]);
                    }
                    
                }
            }
        })
    })

}

$(document).on('click', '.galactic-editor-line', function () {
    let index = $(this).data('project-number');
    for (let i = 0; i < changes_lines.length; i++) {
        if (changes_lines[i].project === index) {
            changes_lines.splice(i, 1);
            break;
        }
    }
    for (let i = 0; i < connections.length; i++) {
        if (connections[i][0] === index && connections[i][1] === index) {
            connections.splice(i, 1);
            break;
        }
    }
    $(this).remove();
})