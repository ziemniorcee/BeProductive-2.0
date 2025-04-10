import {AppDashboard} from "./dashboard/dashboard.mjs";

export class AppController {
    constructor(app) {
        this.app = app
        this.appDashboard = new AppDashboard(app)
    }

    init() {
        this.appDashboard.projects.build(false)
    }
}





