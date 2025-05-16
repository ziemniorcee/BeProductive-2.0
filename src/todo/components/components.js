import {Categories} from "./category.mjs";
import {Steps} from "./steps.mjs";

export class TodoComponents {
    constructor(appSettings) {
        this.steps = new Steps(appSettings)
        this.categories = new Categories(appSettings)
    }
}