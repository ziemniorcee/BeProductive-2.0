import {_hide_sidebar} from "./sidebar.mjs";

export class Inbox {
    constructor() {
        this.initEventListeners()
    }

    initEventListeners(){
        $(document).on('click', "#dashInbox", () =>{
            this.build_inbox()
        })


        $(document).on('click', '#inboxAdd', ()=> {
            let name = $('#inboxInput').val()
            this.add_todo(name)
        })
    }

    build_inbox(){
        const main_template = $('#inboxMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        _hide_sidebar()
        $('#main').html($main_clone)

        this.load_inbox()
    }

    load_inbox(){
        let data = ["ebe", 'aba']

        for (let i = 0; i<data.length; i++){
            this.add_todo(data[i])
        }
    }

    add_todo(name){
        const template = $('#inboxTodoTemplate').prop('content');
        let id = $('.inboxTodo').length
        let $clone = $(template).clone()
        $clone.find('.inboxTodoId').text(id);
        $clone.find('.task').text(name);
        $('#inboxList').prepend($clone)
    }
}






