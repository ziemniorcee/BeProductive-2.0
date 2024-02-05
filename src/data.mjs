export const categories = {
    1: ["rgb(59, 21, 31)", "None"],
    2: ["rgb(50, 23, 77)", "Work"],
    3: ["rgb(0, 34, 68)", "School"],
    4: ["rgb(2, 48, 32)", "House"]
}

export let check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 201, 14)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]

export function getIdByColor(dict, color) {
    for (let id in dict) {
        if (dict[id].includes(color)) {
            return id;
        }
    }
    return 1;
}

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

