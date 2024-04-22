export const categories = {
    1: ["rgb(59, 21, 31)", "None"],
    2: ["rgb(50, 23, 77)", "Work"],
    3: ["rgb(0, 34, 68)", "School"],
    4: ["rgb(2, 48, 32)", "House"],
    5: ["rgb(115, 29, 111)", "Reading"],
    6: ["rgb(77, 73, 18)", "Japanese"],
}

export const categories2 = ["rgb(106, 59, 71, 1)", "rgb(97, 51, 142, 1)" ,"rgb(59, 120, 182, 1)",
    "rgb(32, 121, 90, 1)", "rgb(194, 49, 187)","rgb(166, 157, 39)"]

export let check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 201, 14)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]

export let range1_backgrounds = ["#FFFF00", "#FFFF80", "#FFFFFF", "#404040", "#000000"]
export let range2_backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

export function getIdByColor(dict, color) {
    for (let id in dict) {
        if (dict[id].includes(color)) {
            return id;
        }
    }
    return 1;
}

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdays_grid = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];

