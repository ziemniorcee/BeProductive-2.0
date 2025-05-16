import {CurrentDate} from "./date.js";
import {Data} from "./data/data.js";

export class AppSettings {
    constructor(app) {
        this.app = app
        this.data = new Data()
        this.date = new CurrentDate(this.app)
    }

    async init() {
        await this.data.init()
    }
}



