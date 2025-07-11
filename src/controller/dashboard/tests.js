export class Tests {
    constructor(app) {
        this.app = app
        this.init()
    }

    init() {
        $(document).on('click', '#testResetToken', () => {
            this.app.services.set_token(null)
        })
    }
}