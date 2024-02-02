export const categories = {
    1: ["rgb(59, 21, 31)", "None"],
    2: ["rgb(50, 23, 77)", "Work"],
    3: ["rgb(0, 34, 68)", "School"],
    4: ["rgb(2, 48, 32)", "House"]
}

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
