import { calculateContainment, categories, categories2, projects, project_conn, extractNumbers, calculateChildPosition, divide_to_boxes } from "./data.mjs";

let clicked_project = '';
let changes_lines = [];
let changes_projects = [];
let connections = [];
let current_project = 0;
let scale = 1;

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
    scale = 1;
    changes_lines = [];
    changes_projects = [];
    current_project = key;
    let box = $('#galacticContainer');
    box.empty();
    box.html(_galactic_editor_HTML(key));

    const container = $('#galacticContainer');
    const map = $('#galactic-editor');
    map.draggable({
        start: function(event, ui) {
            $('galacticContainer').css('cursor', 'grab');
            ui.helper.data("pointer", {
                y: (event.pageY - $('#galacticContainer').offset().top) / scale - parseInt($(event.target).css('top')),
                x: (event.pageX - $('#galacticContainer').offset().left) / scale - parseInt($(event.target).css('left'))
            })
        },
        drag: function (event, ui) {
            // var pointer = ui.helper.data("pointer");
            // var canvasTop = $('#galacticContainer').offset().top;
            // var canvasLeft = $('#galacticContainer').offset().left;
            // ui.position.top = Math.round((event.pageY - canvasTop) / scale - pointer.y); 
            // ui.position.left = Math.round((event.pageX - canvasLeft) / scale - pointer.x); 
            
            const containerWidth = container.width();
            const containerHeight = container.height();

            const scaledWidth = map.width() * scale;
            const scaledHeight = map.height() * scale;

            const leftLimit = containerWidth - scaledWidth;
            const topLimit = containerHeight - scaledHeight;

            ui.position.left = Math.min(0, Math.max(leftLimit, ui.position.left));
            ui.position.top = Math.min(0, Math.max(topLimit, ui.position.top));
        }
    });

      // Obsługa zoomowania kółkiem myszy
    container.on('wheel', function (e) {
        e.preventDefault();
        const zoomStep = 0.1;
        const maxScale = 4;
        const minScale = 1;

        const delta = e.originalEvent.deltaY > 0 ? -zoomStep : zoomStep;
        const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));

        if (newScale !== scale) {
          const containerOffset = container.offset();
          const mouseX = e.pageX - containerOffset.left;
          const mouseY = e.pageY - containerOffset.top;

          const prevScaledWidth = map.width() * scale;
          const prevScaledHeight = map.height() * scale;

          scale = newScale;
          map.css('transform', `scale(${scale})`);

          const newScaledWidth = map.width() * scale;
          const newScaledHeight = map.height() * scale;

          const dx = (mouseX / prevScaledWidth) * (newScaledWidth - prevScaledWidth);
          const dy = (mouseY / prevScaledHeight) * (newScaledHeight - prevScaledHeight);

          const newLeft = parseFloat(map.css('left')) - dx;
          const newTop = parseFloat(map.css('top')) - dy;

          const leftLimit = container.width() - newScaledWidth;
          const topLimit = container.height() - newScaledHeight;

          map.css({
            left: Math.min(0, Math.max(leftLimit, newLeft)),
            top: Math.min(0, Math.max(topLimit, newTop))
          });
        }
      });



    // $('#galactic-editor').on('wheel', function(event) {
    //     event.preventDefault();
    //     let offset = $('#galacticContainer').offset();
    //     let size = {x: $('#galactic-editor').outerWidth(), y: $('#galactic-editor').outerHeight()}
    //     const x_old = parseFloat($(this).css('left'));
    //     const y_old = parseFloat($(this).css('top'));
    //     let x = event.originalEvent.clientX - size.x / 2;
    //     let y = event.originalEvent.clientY - size.y / 2;
    //     let multiplier = event.originalEvent.deltaY > 0 ? -0.05 : 0.05;
    //     let newScale = Math.min(Math.max(scale + multiplier, 1), 5);
    //     let dx = x_old - x * (newScale / scale - 1);
    //     let dy = y_old - y * (newScale / scale - 1);
    //     $(this).css('transform', 'scale(' + scale + ')');
    //     $(this).css('left', dx + 'px');
    //     $(this).css('top', dy + 'px');
    //     scale = newScale;
    //     console.log(scale);
    // });

    // // background panning event
    // $('#galactic-editor').draggable({
    //     start: function(event, ui) {
    //         $('galacticContainer').css('cursor', 'grab');
    //         ui.helper.data("pointer", {
    //             y: (event.pageY - $('#galacticContainer').offset().top) / scale - parseInt($(event.target).css('top')),
    //             x: (event.pageX - $('#galacticContainer').offset().left) / scale - parseInt($(event.target).css('left'))
    //         })
    //     },
    //     drag: function(event, ui) {
    //         var pointer = ui.helper.data("pointer");
    //         var canvasTop = $('#galacticContainer').offset().top;
    //         var canvasLeft = $('#galacticContainer').offset().left;
    //         var canvasHeight = $('#galacticContainer').height();
    //         var canvasWidth = $('#galacticContainer').width();
    //         ui.position.top = Math.round((event.pageY - canvasTop) / scale - pointer.y); 
    //         ui.position.left = Math.round((event.pageX - canvasLeft) / scale - pointer.x); 

    //         if (ui.position.left > 0) ui.position.left = 0;
    //         if (ui.position.left + $(this).width() < canvasWidth) ui.position.left = canvasWidth - $(this).width();  
    //         if (ui.position.top > 0) ui.position.top = 0;
    //         if (ui.position.top + $(this).height() < canvasHeight) ui.position.top = canvasHeight - $(this).height();  

    //         ui.offset.top = Math.round(ui.position.top + canvasTop);
    //         ui.offset.left = Math.round(ui.position.left + canvasLeft);

    //         console.log(ui.position)
    //     },
    //     stop: function(event, ui) {
    //         $('galacticContainer').css('cursor', 'pointer');
    //     }
    // })
    
    // adding line connections from database
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

    // event for to-place projects in the settings
    $('.galactic-editor-to-place').each(function(index, element) {
        $(element).draggable({
            cursorAt: {left: 0, top: 0},
            scroll: false,
            start: function(event, ui) {
                $(element).css('transform', 'translate(-50%, -50%)');
                ui.helper.data('containment', calculateContainment(element, $('#galactic-editor'), [0, 0, 0, 0]));
            },
            stop: function(event, ui) {
                const boundingBox = ui.helper.data('containment');
                if (event.pageX > boundingBox[0] && event.pageX < boundingBox[2] &&
                    event.pageY > boundingBox[1] && event.pageY < boundingBox[3]) {
                    console.log("mhm")
                    let offset = $("#galactic-editor").offset();
                    $(element).appendTo("#galactic-editor");
                    $(element).removeClass("galactic-editor-to-place");
                    $(element).addClass("galactic-editor-project");
                    $(element).attr("id", `galacticEditorProject${$(element).data('project-number')}`)
                    $(element).css("left", `${event.pageX - offset.left}px`);
                    $(element).css("top", `${event.pageY - offset.top}px`);
                    bind_editor_project(key, element);
                    change_editor_project_position(element);
                    if ($('#galactic-editor-project-picker').children().length === 1) {
                        $('#galactic-editor-project-picker').css('display', 'none');
                    }
                } else {
                    console.log("aha")
                    $(element).css('position', 'relative');
                    $(element).css('top', 'auto');
                    $(element).css('left', 'auto');
                    $(element).css('transform', 'translate(0, 0)');
                }
                
            }
        })
    })
    $('.galactic-editor-project').each(function(index, element) { 
        bind_editor_project(key, element);
    })
}

$(document).on('click', '#galactic-editor-confirm', function () {
    save_galactic_editor_changes();
    add_galactic_category_boxes();
})

$(document).on('click', '#galactic-editor-open-projects', function () {
    let element = $('#galactic-editor-project-picker')
    if (($(element).children().length > 1) && !$(element).is(":visible")) {
        $(element).css('display', 'flex');
        console.log('lol1')
    }
    else if ($(element).is(":visible")) {
        $(element).css('display', 'none');
        console.log('lol2')
    }
})

$(document).on('click', '#galactic-editor-cancel', function () {
    connections.length = 0;
    add_galactic_category_boxes()
})

$(document).on('mousemove', '#galactic-editor', function (event) {
    if (clicked_project !== '') {
        let line = document.getElementById('galactic-editor-line-moving');
        if (line) {
            let canvasTop = $('#galactic-editor').offset().top;
            let canvasLeft = $('#galactic-editor').offset().left;
            line.x2.baseVal.value = Math.round((event.pageX - canvasLeft) / scale);
            line.y2.baseVal.value = Math.round((event.pageY - canvasTop) / scale);
        } 
    }
})

// handling releasing the left click over the bg
$(document).on('mouseup', '#galactic-editor', function () {
    $('#galactic-editor-line-moving').remove();
    clicked_project = '';
})

// handling line removing
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
function bind_editor_project(key, element) {
    $(element).draggable({
        cursorAt: {left: 0, top: 0},
        containment: calculateContainment(element, $('#galactic-editor'), [0.1, 0.2, 0.1, 0.1]),
        scroll: false,
        start: function(event, ui) {
            ui.helper.data("pointer", {
                y: (event.pageY - $('#galactic-editor').offset().top) / scale - parseInt($(event.target).css('top')),
                x: (event.pageX - $('#galactic-editor').offset().left) / scale - parseInt($(event.target).css('left'))
            })
        },
        drag: function(event, ui) {
            var pointer = ui.helper.data("pointer");
            var canvasTop = $('#galactic-editor').offset().top;
            var canvasLeft = $('#galactic-editor').offset().left;
            var canvasHeight = $('#galactic-editor').height();
            var canvasWidth = $('#galactic-editor').width();
        
            ui.position.top = Math.round((event.pageY - canvasTop) / scale - pointer.y); 
            ui.position.left = Math.round((event.pageX - canvasLeft) / scale - pointer.x); 
        
            if (ui.position.left < 0) ui.position.left = 0;
            if (ui.position.left + $(this).width() > canvasWidth) ui.position.left = canvasWidth - $(this).width();  
            if (ui.position.top < 0) ui.position.top = 0;
            if (ui.position.top + $(this).height() > canvasHeight) ui.position.top = canvasHeight - $(this).height();  

            ui.offset.top = Math.round(ui.position.top + canvasTop);
            ui.offset.left = Math.round(ui.position.left + canvasLeft);
            
            $(element).css({top: `${ui.position.top}px`, left:`${ui.position.left}`})

            let number = $(element).data('project-number');
            for (let conn of connections) {
                if (conn[0] == number) {
                    let line = document.getElementById(`galactic-editor-line${conn[0]}-${conn[1]}`);
                    let pos = ui.position;
                    line.x1.baseVal.value = pos.left;
                    line.y1.baseVal.value = pos.top;
                }
                else if (conn[1] == number) {
                    let line = document.getElementById(`galactic-editor-line${conn[0]}-${conn[1]}`);
                    let pos = ui.position;
                    line.x2.baseVal.value = pos.left;
                    line.y2.baseVal.value = pos.top;
                }
            }
        },
        stop: function(event, ui) {
            change_editor_project_position(element);
        }
    })

    // handling click on project and create temporary line
    $(element).on('mousedown', function (event) {
        if (event.button === 2) {
            clicked_project = $(element).attr('id');
            let pos = {top: parseFloat($(element).css('top')) - $(element).outerHeight() / 2, 
                       left: parseFloat($(element).css('left')) - $(element).outerWidth() / 2};
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

    // handling destroying / adding the line
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
}

export function change_editor_project_position(element) {
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


export function save_galactic_editor_changes() {
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
}

/**
 * Returns html of galactic editor.
 * @param {number} key - galactic id
 * @returns {string} html of galactic editor for given category
 * */
function _galactic_editor_HTML(key) {
    $('<style>')
        .prop('type', 'text/css')
        .html(`#galactic-editor-slider::-webkit-slider-thumb {
            background: ${categories2[key]}}`)
        .appendTo('head');
    let editor = `<div id="galactic-editor">
    <div class='galactic-editor-test' style="top: 0%; left: 0%"></div>
    <div class='galactic-editor-test' style="top: 50%; left: 0%"></div>
    <div class='galactic-editor-test' style="top: 0%; left: 50%"></div>
    <div class='galactic-editor-test' style="top: 50%; left: 50%"></div>
    <svg id="galactic-editor-canv" width="100%" height="100%" preserveAspectRatio="none"></svg>`;
    let not_placed_projects = [];
    for (const proj of projects) {
        if (proj.category == key) {
            if (proj.x === null || proj.y === null) {
                not_placed_projects.push(proj);
            }
            else {
                editor += `<div class="galactic-editor-project galactic-editor-items" id="galacticEditorProject${proj.id}" data-project-number="${proj.id}"
                style="top: ${proj.y}%; left: ${proj.x}%; border-color: ${categories[key][0]}; background-color: ${categories2[key]};"
                >${proj.name}</div>`
            }
        }
    }
    editor += '</div>'
    editor += `</div>
    <div id="galactic-editor-hud" style="border-color: ${categories[key][0]};">
    <span id="galactic-editor-text" style='color: ${categories2[key]}'>${categories[key][1]}</span>
    <div id="galactic-editor-cancel">
    <img src="images/goals/arrow0.png"></div>
    <div id='galactic-editor-options-btn'>
    <img src="images/goals/more.png">
    <div id='galactic-editor-options'>
    <div id='galactic-editor-new-category' class='galacticOption'>
    <img src="images/goals/plus.png">
    <span>New project</span></div>
    <div id='galactic-editor-remove-category' class='galacticOption'>
    <img src="images/goals/minus.png">
    <span>Remove project</span></div>
    <div id='galactic-editor-open-projects' class='galacticOption'>
    <img src="images/goals/plus.png">
    <span>Open not placed projects</span></div>
    </div></div>`;
    editor += `<div id="galactic-editor-project-picker" style="border-color: ${categories[key][0]};">
    <span>Stash</span>`
    for (const proj of not_placed_projects) {
        editor += `<div class="galactic-editor-to-place" data-project-number="${proj.id}"
                style="border-color: ${categories[key][0]}; background-color: ${categories2[key]};"
                >${proj.name}</div>`
    }
    editor += '</div>'
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
                if (proj.x !== null && proj.y !== null) {
                    boxes[pointer] += `<div class="galactic-project-icon" id="galactic${key}Project-${proj.id}"
                    style="top: ${proj.y}%; left: ${proj.x}%;"
                    ></div>`
                }
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


