export class Data {
    constructor() {
        this.weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        this.weekdays_grid = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];
        this.icons = [{
            name: "book",
            path: "images/goals/projects/book.png"
        }, {
            name: "bug",
            path: "images/goals/projects/bug.png"
        }, {
            name: "dashboard",
            path: "images/goals/projects/dashboard.png"
        }, {
            name: "keys",
            path: "images/goals/projects/keys.png"
        }, {
            name: "productivity",
            path: "images/goals/projects/productivity.png"
        }]

        this.categories = {};
        this.categories2 = {}
        this.projects = []
        this.project_conn = []

        this.merged_icons = []
    }

    async init() {
        let categories_data = await window.dataAPI.getCategories();
        this.projects = await window.dataAPI.getProjects()
        console.log(projects)
        this.project_conn = await window.dataAPI.getGalacticConnections()

        this.set_categories(categories_data)
    }

    set_categories(categories_data) {
        for (let category of categories_data) {
            this.categories[category.id] = [
                `rgb(${category.r}, ${category.g}, ${category.b})`,
                category.name
            ]

            let new_r = Math.min(Math.floor(category.r * 3 / 2), 255)
            let new_g = Math.min(Math.floor(category.g * 3 / 2), 255)
            let new_b = Math.min(Math.floor(category.b * 3 / 2), 255)

            this.categories2[category.id] = `rgb(${new_r}, ${new_g}, ${new_b})`
        }
    }


    async loadIcons() {
        this.merged_icons = JSON.parse(JSON.stringify(this.icons));

        const result = await window.electronAPI.getIcons();
        let icons_imported = result['files']
        for (let i = 0; i < icons_imported.length; i++) {
            this.merged_icons.push(icons_imported[i])
        }
    }


    findNameByPath = (path) => {
        const icon = this.merged_icons.find(icon => icon.path === path);
        return icon ? icon.name : null;
    };

    findPathByName = (name) => {
        const icon = this.merged_icons.find(icon => icon.name === name);
        return icon ? icon.path : null;
    };

    /**
     * build HTML of project being in
     * @returns {string} HTML alredy emblem
     */
    already_emblem_HTML() {
        return `
        <div class="alreadyEmblem">
            <div class="alreadyEmblemILetters">
                <span class="alreadyEmblemILetter">I</span>
                <span class="alreadyEmblemNLetter">N</span>
            </div>
        </div>`
    }

    /**
     * builds html of project emblem
     * @param project_pos
     * @returns {string} returns HTML
     */
    project_emblem_html(project_pos) {
        let project_emblem = ''
        if (project_pos !== -1 && project_pos !== undefined) {
            console.log()
            let project_color = this.categories[this.projects[project_pos]['category']][0]
            let project_icon = this.findPathByName(this.projects[project_pos]['icon'])

            project_emblem = `
            <div class="projectEmblem" style="background-color: ${project_color}">
                <img src="${project_icon}" alt="">
                <div class="projectPos">${project_pos}</div>
            </div>
        `
        }
        return project_emblem
    }

    /**
     * creates repeat label
     * @returns {string} HTML of repeat label
     */
    _repeat_label_HTML() {
        return `
        <div class="repeatLabelShow">
            <img class="repeatLabelImg" src="images/goals/repeat.png" alt="">
        </div>`
    }
}

export let categories = {};
export let categories2 = {};
export let projects = [];
export let project_conn = [];

let icons = [{
    name: "book",
    path: "images/goals/projects/book.png"
}, {
    name: "bug",
    path: "images/goals/projects/bug.png"
}, {
    name: "dashboard",
    path: "images/goals/projects/dashboard.png"
}, {
    name: "keys",
    path: "images/goals/projects/keys.png"
}, {
    name: "productivity",
    path: "images/goals/projects/productivity.png"
}]
export let merged_icons = []

export let check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 201, 14)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]

export let range1_backgrounds = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]
export let range2_backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

export function extractNumbers(str) {
    return str.match(/\d+/g).map(Number);
}

export function getIdByColor(dict, color) {
    for (let id in dict) {
        if (dict[id].includes(color)) {
            return id;
        }
    }
    return 1;
}

export function hsvToRgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

/**
 * Calculates percentage position of child in parent div.
 * @param {HTMLElement} childSelector - child's element
 * @param {HTMLElement} parentSelector - parent's element
 * @returns {Array} array od x and y percentages
 * */
export function calculateChildPosition(childSelector, parentSelector) {
    var child = $(childSelector);
    var parent = $(parentSelector);

    var childOffset = child.offset();
    var parentOffset = parent.offset();

    var childCenterX = childOffset.left + (child.outerWidth() / 2);
    var childCenterY = childOffset.top + (child.outerHeight() / 2);

    var relativeX = childCenterX - parentOffset.left;
    var relativeY = childCenterY - parentOffset.top;

    var parentWidth = parent.width();
    var parentHeight = parent.height();

    var percentX = (relativeX / parentWidth) * 100;
    var percentY = (relativeY / parentHeight) * 100;

    return {x: percentX, y: percentY};
}

/**
 * Creates containtment list for jQuery UI draggable.
 * @param {HTMLElement} that - targeted element.
 * @param {HTMLElement} parent - targeted element.
 * @param {Array} limits - offset array (from 0 to 1) (left, top, right, bottom).
 * */
export function calculateContainment(that, parent, limits) {
    var parentOffset = $(parent).offset();
    var parentWidth = $(parent).width();
    var parentHeight = $(parent).height();
    var elementWidth = $(that).width();
    var elementHeight = $(that).height();
    let res = [
        parentOffset.left + parentWidth * limits[0],
        parentOffset.top + parentHeight * limits[1],
        parentOffset.left + parentWidth * (1 - limits[2]),
        parentOffset.top + parentHeight * (1 - limits[3])
    ];
    return res;
}

/**
 * Splits integer into few integers ones close to each other.
 * @param {number} n - given number
 * @returns {Array} splitted integers
 * */
export function divide_to_boxes(n) {
    let res = []
    let q = Math.ceil(Math.sqrt(n))
    let flag = true
    while (n !== 0) {
        res.push(q);
        n -= q
        if (flag && (n % (q - 1) === 0)) {
            flag = false
            q -= 1
        } else if (n < 0) {
            break;
        }
    }
    return res
}

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdays_grid = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];


export function decode_text(text) {
    return text.replace(/`@`/g, "'").replace(/`@@`/g, '"')
}

export function encode_text(text) {
    return text.replace(/'/g, "`@`").replace(/"/g, "`@@`")
}

export let colors = []


