export let categories = {};
export let categories2 = {};
export let projects = [];
export let project_conn = [];

export let icons = ["book", "bug", "dashboard", "keys", "productivity"]


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

    return { x: percentX, y: percentY };
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
    console.log(res);
    return res;
}

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdays_grid = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];


export function decode_text(text){
    return text.replace(/`@`/g, "'").replace(/`@@`/g, '"')
}

export function encode_text(text){
    return text.replace(/'/g, "`@`").replace(/"/g, "`@@`")
}

export let colors = [

]