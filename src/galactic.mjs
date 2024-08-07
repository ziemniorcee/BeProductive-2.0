import { categories, categories2 } from "./data.mjs";

$(document).on('click', '#strategy', function () {
    $('#galactics').css('display', 'block');
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
        galactics += `<div class='galactic' style='border-color: ${categories2[key]}'>
                            <span class='galactic-text' style='color: ${categories2[key]}'>${categories[key][1]}</span>
                    </div>`
        if ((counter % 5 == 1) || (counter % 5 == 4)) galactics += `</div>`;
        counter++;
    }
    let box = $('#galacticContainer');
    box.empty();
    box.html(galactics);
})
