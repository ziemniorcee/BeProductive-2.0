import {Categories} from "./category.mjs";
import {Steps} from "./steps.mjs";

export class TodoComponents {
    constructor(app) {
        this.steps = new Steps(app)
        this.categories = new Categories(app)
    }
}