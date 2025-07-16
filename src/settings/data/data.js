import {ProjectsSettings} from "./project.js";
import {CategoriesSettings} from "./categories.js";

export class Data {
    constructor(app) {
        this.app = app
        this.projects = new ProjectsSettings(app)
        this.categories = new CategoriesSettings(app)

        this.month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.weekdays2 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        this.weekdays_grid = [["Monday"], ["Tuesday", "Friday"], ["Wednesday", "Saturday"], ["Thursday", "Sunday"]];
        this.weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        this.check_border = ["rgb(0, 117, 255)", "rgb(36, 255, 0)", "rgb(255, 255, 255)", "rgb(255, 92, 0)", "rgb(255, 0, 0)"]
        this.range2_backgrounds = ["#00A2E8", "#24FF00", "#FFFFFF", "#FF5C00", "#FF0000"]

        this.localStorage = "myDaySetupState"
        // this.localStorage = "myDaySetupStateREAL"
    }

    async init(hard = false) {
        await this.categories.init()
        await this.projects.init(hard)

        this.habits = await window.dataAPI.getHabits()
        this.habits_days = await window.dataAPI.getHabitsDays()
        this.habits_logs = await window.dataAPI.getHabitsLogs()
        this.habits.forEach(habit => {
            habit.days = [];
            this.habits_days.forEach(day => {
                if (habit.id === day.habit_id) {
                    let {habit_id, ...copy} = day;
                    habit.days.push({...copy});
                }
            })
        });
    }

    decode_text(text) {
        if (text === undefined) return ""
        return text.replace(/`@`/g, "'").replace(/`@@`/g, '"')
    }

    encode_text(text) {
        return text.replace(/'/g, "`@`").replace(/"/g, "`@@`")
    }

    getIdByColor(dict, color) {
        for (let id in dict) {
            if (dict[id].includes(color)) {
                return id;
            }
        }
        return 1;
    }

    hsvToRgb(h, s, v) {
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
    }

    extractNumbers(str) {
        return str.match(/\d+/g).map(Number);
    }

    /**
     * Calculates percentage position of child in parent div.
     * @param {HTMLElement} childSelector - child's element
     * @param {HTMLElement} parentSelector - parent's element
     * @returns {Array} array od x and y percentages
     * */
    calculateChildPosition(childSelector, parentSelector) {
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
    calculateContainment(that, parent, limits) {
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
    divide_to_boxes(n) {
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

    /**
     * shows or hides sidebar
     * @param force if true no matter current state it forces selected state
     * @param force_option 0 - show, 1 - hide
     */
    show_hide_sidebar(force = false, force_option = null) {
        let $rightbar = $('#rightbar')
        let $resizer = $('#resizer')
        let to_hide = false

        if (force) {
            if (force_option === 1) {
                to_hide = true
            }
        } else {
            to_hide = $rightbar.css('display') === 'block'
        }

        $rightbar.css('display', to_hide ? 'none' : 'block')
        $resizer.css('display', to_hide ? 'none' : 'flex')
    }

    compare_times(first_time, second_time) {
        let [hours1, minutes1] = first_time.split(":").map(Number);
        let [hours2, minutes2] = second_time.split(":").map(Number);
        return (hours2 * 60 + minutes2) - (hours1 * 60 + minutes1);
    }
}
