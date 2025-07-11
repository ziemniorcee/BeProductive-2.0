export class Init {
    constructor(app) {
        this.app = app
    }

    async init() {
        if (await this.app.services.is_token_valid()){
            await this.app.settings.init()
            await this.app.controller.init()
            await this.app.todo.todoViews.init()
        }
        else {
            this.app.vignette.loginVignette.display()
        }
    }

    async hard_init(){
        await this.app.settings.init(true)
        await this.app.controller.init()
        await this.app.todo.todoViews.init()
    }
}