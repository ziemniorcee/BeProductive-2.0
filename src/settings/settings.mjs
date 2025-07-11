import {CurrentDate} from "./date.js";
import {Data} from "./data/data.js";

export class AppSettings {
    constructor(app) {
        this.app = app
        this.data = new Data(app)
        this.date = new CurrentDate(app)
    }

    async init(hard = false) {
        await this.data.init(hard)
    }
}



