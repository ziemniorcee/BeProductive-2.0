import { Habits } from "./habits/habits.mjs";
import {AppSettings} from "./settings/settings.mjs";
import {Todo} from "./todo/todo.mjs";
import {AppController} from "./controller/controller.mjs";
import {Vignette} from "./vignette/vignette.mjs";
import {Strategy} from "./strategy/galactic.mjs";
import {AppServices} from "./services/services.js";
import {Init} from "./init.js";


class MainApp {
    constructor() {
        this.settings = new AppSettings(this)
        this.services = new AppServices(this)
        this.controller = new AppController(this)
        this.vignette = new Vignette(this)
        this.init = new Init(this)

        this.todo = new Todo(this)
        this.strategy = new Strategy(this.settings, this)
        this.habits = new Habits(this.settings, this)
    }

    // async init() {
    //     await this.settings.init()
    //     await this.controller.init()
    //     await this.todo.todoViews.init()
    // }
}


const app = new MainApp();

(async () => {
    await app.init.init()
})();