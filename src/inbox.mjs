import {build_view} from "./render.mjs";

$(document).on('click', "#dashInbox", () =>{
    build_view(_inbox_body(), _inbox_head())

    load_inbox()
})

function load_inbox(){
    let data = ["ebe", 'aba']

    for (let i = 0; i<data.length; i++){
        add_todo(data[i])
    }
}

function add_todo(name){
    const template = $('#inboxTodoTemplate').prop('content');
    let id = $('.inboxTodo').length
    let $clone = $(template).clone()
    $clone.find('.inboxTodoId').text(id);
    $clone.find('.task').text(name);
    $('#inboxList').prepend($clone)
}

$(document).on('click', '#inboxAdd', ()=> {
    let name = $('#inboxInput').val()
    add_todo(name)
})


function _inbox_body(){
    return `
        <div id="inboxBody">
            <div id="inboxEntry">
                <input id="inboxInput" type="text" spellcheck="false" placeholder="Result">
                <div id="inboxAdd">+</div>
            </div>
            <div id="inboxList">
                
            </div>
        </div>`
}

function _inbox_head(){
    return `<div id="inboxHeader">Inbox</div>`
}

