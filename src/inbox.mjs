import {_hide_sidebar} from "./sidebar.mjs";

$(document).on('click', "#dashInbox", () =>{
    build_inbox()
})

function build_inbox(){
    const main_template = $('#inboxMainTemplate').prop('content');
    let $main_clone = $(main_template).clone()
    _hide_sidebar()
    $('#main').html($main_clone)

    load_inbox()
}

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