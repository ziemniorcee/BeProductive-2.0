import {CurrentDate} from "./date.js";
import {Data} from "./data/data.js";

export class AppSettings {
    constructor() {
        this.data = new Data()
        this.date = new CurrentDate(this)
    }

    async init() {
        await this.data.init()
    }
}



