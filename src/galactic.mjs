import { calculateContainment, categories, categories2, projects, project_conn, extractNumbers, calculateChildPosition, divide_to_boxes } from "./data.mjs";

let clicked_project = '';
let changes_lines = [];
let changes_projects = [];
let connections = [];
let current_project = 0;

$(document).on('click', '#strategy', function () {
    $('#galactics').css('display', 'block');
    add_galactic_category_boxes();
    $('#galactic-editor').remove();
})

/**
 * Creates category windows in main galactic screen
 */
export function add_galactic_category_boxes() {
    let box = $('#galacticContainer');
    box.empty();
    box.html(_galactic_display_HTML());
    for (const key in categories) {
        for (const conn of project_conn) {
            if (conn.category == key) {
                $(`#galactic-canv${key}`).append(create_line(
                    `#galactic${key}Project-${conn.project_from}`,
                    `#galactic${key}Project-${conn.project_to}`,
                    `galactic-project-line`,
                    `galactic${key}Line${conn.project_from}-${conn.project_to}`, key,
                    4, `rgb(240, 255, 255)`
                ));
            }
        }
    }
}

$(document).on('click', '.galactic', function() {
    const match = $(this).attr('id').match(/\d+$/);
    const key = match ? parseInt(match[0], 10) : null;
    create_galactic_editor(key);
})


/**
 * Creates editor of certain galactic in galactics div.
 * @param {number} key - galactic id.
 * */
function create_galactic_editor(key) {
    changes_lines = [];
    changes_projects = [];
    current_project = key;
    let box = $('#galacticContainer');
    box.empty();
    box.html(_galactic_editor_HTML(key));
    
    for (let conn of project_conn) {
        if (conn['category'] === key) {
            $("#galactic-editor-canv").append(create_line(
                `#galacticEditorProject${conn['project_from']}`,
                `#galacticEditorProject${conn['project_to']}`,
                `galactic-editor-line`,
                `galactic-editor-line${conn['project_from']}-${conn['project_to']}`, key
            ));
            connections.push([conn['project_from'], conn['project_to']]);
        }
    }
    console.log(connections);

    $(document).on('click', '#galactic-editor-confirm', function () {
        console.log(changes_lines);
        console.log(changes_projects);
        window.goalsAPI.changeProjectCoords({'changes': changes_projects});
        window.goalsAPI.changeGalacticConnections({'changes': changes_lines});
        for (let change of changes_projects) {
            for (let i = 0; i < projects.length; i++) {
                if (projects[i].id === change.id) {
                    projects[i].x = change.x;
                    projects[i].y = change.y;
                }
            }
        }
        for (let change of changes_lines) {
            if (change.add) {
                project_conn.push({
                    'category': change.category,
                    'project_from': change.from,
                    'project_to': change.to
                })
            } else {
                for (let i = 0; i < project_conn.length; i++) {
                    if (project_conn[i].category === change.category &&
                        project_conn[i].project_from === change.from &&
                        project_conn[i].project_to === change.to)
                        project_conn.splice(i, 1);
                }
            }
        }
        add_galactic_category_boxes();
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
    bind_editor_projects(key);
}



$(document).on('click', '.galactic-editor-line', function () {
    let index = extractNumbers($(this).attr('id'));
    let flag = true;
    for (let i = 0; i < changes_lines.length; i++) {
        if (changes_lines[i].from === index[0] && changes_lines[i].to === index[1]) {
            changes_lines.splice(i, 1);
            flag = false;
            break;
        }
    }
    if (flag) {
        changes_lines.push({'category': current_project, 'from': index[0], 'to': index[1], 'add': false});
    }
    for (let i = 0; i < connections.length; i++) {
        if (connections[i][0] === index[0] && connections[i][1] === index[1]) {
            connections.splice(i, 1);
            break;
        }
    }
    $(this).remove();
})


/**
 * Creates editor of certain galactic in galactics div.
 * @param {string} div_from - div id by first edge of line
 * @param {string} div_to - div id by the other edge of line
 * @param {string} line_class - class of line
 * @param {string} line_id - id of line
 * @param {number} key - galactic id
 * @param {number} w - line width
 * @param {string} color - galactic id
 * @returns {SVGLineElement} svg line element
 * */
function create_line(div_from, div_to, line_class, line_id, key, w = 8, color = undefined) {
    let pos1 = $(div_from).position();
    let pos2 = $(div_to).position();
    let line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('class', line_class)
    line.setAttribute('id', line_id)
    line.setAttribute('x1', pos1.left + $(div_from).outerWidth() / 2);
    line.setAttribute('y1', pos1.top + $(div_from).outerHeight() / 2);
    line.setAttribute('x2', pos2.left + $(div_to).outerWidth() / 2);
    line.setAttribute('y2', pos2.top + $(div_to).outerHeight() / 2);
    line.setAttribute('stroke', (color === undefined) ? categories2[key] : color);
    line.setAttribute('stroke-width', w);
    return line;
}


/**
 * Binds projects to draggable event and line linking events.
 * @param {number} key - galactic id
 * */
function bind_editor_projects(key) {
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
                if (released_project !== clicked_project) {
                    let conn = [$(`#${clicked_project}`).data('project-number'), $(element).data('project-number')];
                    conn.sort();
                    if ($(`#galactic-editor-line${conn[0]}-${conn[1]}`).length) ;
                    else {
                        $("#galactic-editor-canv").append(create_line(
                            `#galacticEditorProject${conn[0]}`,
                            `#galacticEditorProject${conn[1]}`,
                            `galactic-editor-line`,
                            `galactic-editor-line${conn[0]}-${conn[1]}`, key
                        ));
                        let flag = true;
                        for (let i = 0; i < changes_lines.length; i++) {
                            if (changes_lines[i].from === conn[0] 
                                && changes_lines[i].to === conn[1]
                                && changes_lines[i].add === false) {
                                changes_lines.splice(i, 1);
                                flag = false;
                                break;
                            }
                        }
                        if (flag) changes_lines.push({'category': key, 'from': conn[0], 'to': conn[1], 'add': true});
                        connections.push([conn[0], conn[1]]);
                    }
                    
                }
            }
        })
    })
}


/**
 * Returns html of galactic editor.
 * @param {number} key - galactic id
 * @returns {string} html of galactic editor for given category
 * */
function _galactic_editor_HTML(key) {
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
    return editor;
}


/**
 * Returns html of galactics.
 * @returns {string} html of galactics display
 * */
function _galactic_display_HTML() {
    let galactics = '';
    const len = Object.keys(categories).length;
    const height = Math.floor(100 / Math.ceil((len - 1) / 5));
    $('<style>')
        .prop('type', 'text/css')
        .html(`.galacticBox {height: ${height}%; }`)
        .appendTo('head');
    let counts = divide_to_boxes(len);
    let boxes = [];
    for (let i = 0; i < counts.length; i++) {
        boxes.push(`<div class='galacticBox' id='galacticBox${i + 1}' style='grid-template-columns: repeat(${counts[i]}, 1fr)'>`)
    }
    let pointer = 0;
    let box_counter = 0;
    console.log(counts)
    for (const key in categories) {
        boxes[pointer] += `<div class='galactic' id="galactic${key}" style='border-color: ${categories2[key]}'>
        <svg id="galactic-canv${key}" width="100%" height="100%" preserveAspectRatio="none"></svg>`
        for (const proj of projects) {
            if (proj.category == key) {
                let h = (proj.y !== null) ? proj.y : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
                let w = (proj.x !== null) ? proj.x : Math.floor(Math.random() * (90 - 10 + 1)) + 10;
                console.log(`${h},    ${w}`)
                boxes[pointer] += `<div class="galactic-project-icon" id="galactic${key}Project-${proj.id}"
                style="top: ${h}%; left: ${w}%;"
                ></div>`
            }
        }
        boxes[pointer] +=`<span class='galactic-text' style='color: ${categories2[key]}'>${categories[key][1]}</span></div>`
        box_counter++;
        if (box_counter === counts[pointer]) {
            pointer++;
            box_counter = 0;
        }
    }
    for (let i = 0; i < counts.length; i++) {
        galactics += boxes[i]
        galactics += '</div>'
    }
    galactics += `<div id='galactic-display-options-btn'>
    <img src="images/goals/more.png">
    <div id='galactic-display-options'>
    <div id='galactic-display-new-category' class='galacticOption'>
    <img src="images/goals/plus.png">
    <span>New category</span></div>
    <div id='galactic-display-remove-category' class='galacticOption'>
    <img src="images/goals/minus.png">
    <span>Remove category</span></div>
    </div>
    </div>`
    return galactics;
}


