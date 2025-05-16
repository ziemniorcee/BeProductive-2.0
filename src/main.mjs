import { Habits } from "./habits/habits.mjs";
import {AppSettings} from "./settings/settings.mjs";
import {Todo} from "./todo/todo.mjs";
import {AppController} from "./controller/controller.mjs";
import {Vignette} from "./vignette/vignette.mjs";
import {Strategy} from "./strategy/galactic.mjs";


class MainApp {
    constructor() {
        this.settings = new AppSettings(this)
        this.controller = new AppController(this)
        this.vignette = new Vignette(this)

        this.todo = new Todo(this.settings)
        this.strategy = new Strategy(this.data, this.categories)
        this.habits = new Habits(this.data, this.categories)
    }

    async init() {
        await this.settings.init()
        await this.controller.init()
        await this.todo.todoViews.init()
    }
}


const app = new MainApp();

(async () => {
    await app.init()
})();