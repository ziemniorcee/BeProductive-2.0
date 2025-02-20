export class Asap {
    constructor(app_data, app_date) {
        this.data = app_data
        this.date = app_date
        this.initEventListeners()
    }

    initEventListeners() {
        $(document).on('click', "#dashASAP", async () => {
            await this.build_view()
        })

        $(document).on('focus', '#ASAPInput', function (){
            $('#ASAPEntry').css('background-color', "#1A3667")
        })

        $(document).on('blur', '#ASAPInput', function (){
            $('#ASAPEntry').css('background-color', "#2A2A2A")
        })
    }

    async build_view() {
        const main_template = $('#ASAPMainTemplate').prop('content');
        let $main_clone = $(main_template).clone()
        this.data.show_hide_sidebar(true, 1)
        $('#main').html($main_clone)

        // let goals = await window.inboxAPI.getInbox()

    }
}