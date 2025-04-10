
export class Steps {
    constructor(app_settings) {
        this.initEventListeners()

        this.appSettings = app_settings
    }

    initEventListeners() {
        $(document).on('change', '.stepEntry', (event) => {
            this.new_step_entry(event.currentTarget)
        });

        $(document).on('keydown', '.stepEntry', (event) => {
            this.change_step_entry(event.currentTarget, event)
        });
    }

    /**
     * switches css steps of goal
     * resets drag
     * @param event1
     */
    show_steps(event1) {
        const steps = $(event1.target).closest(".taskText").find('.steps')
        let show = steps.css("display") === "block"
        steps.css("display", show ? 'none' : 'block')
        $(event1.target).find('.showImg').attr('src', show ? 'images/goals/up.png' : 'images/goals/down.png')
    }

    /**
     * make new step entry in new goal input if edited is current last entry
     * @param that selected step entry in new goal input
     */
    new_step_entry(that) {
        let input_count = $(".stepEntry").length
        if ($('.stepEntry').index(that) === input_count - 1) {
            $('#newSteps').append(`
            <div class="newStepText">
                <input type='text' class='stepEntry' placeholder="Action ${input_count + 1}">
            </div>`)
        }
    }

    /**
     * step change in new goal input for tab click
     * if tab is from the last and value is not empty, step entry it creates new step and go to it
     * else if the value is empty it does nothing
     * @param that selected step in new goal input
     * @param event event of .stepEntry
     */
    change_step_entry(that, event) {
        if (event.which === 9) {
            let step_entry = $('.stepEntry')
            if (step_entry.index(that) === step_entry.length - 1 && $(that).val() !== "") {
                event.preventDefault();

                $('#newSteps').append(`
                <div class="newStepText">
                    <input type='text' class='stepEntry' placeholder="Action ${step_entry.length + 1}">
                </div>`)

                step_entry = $('.stepEntry')
                step_entry.eq(step_entry.length - 1).focus()
            } else if ($(that).val() === "") {
                event.preventDefault();
            }
        }
    }

    /**
     * changes check of selected step
     * @param that selected step
     */
    change_step_check(that) {
        let step_id = Number($(that).closest('.step').find('.stepId').text())
        let check_state = Number(that.checked)
        let counter_html = $(that).closest(".todo").find('.counter').get(0)

        if (check_state) {
            counter_html.innerText = Number(counter_html.innerText) + 1
        } else {
            counter_html.innerText = Number(counter_html.innerText) - 1
        }

        window.goalsAPI.changeChecksStep2({id: step_id, state: check_state})
    }

    _steps_HTML(steps, category_id) {
        let steps_HTML = ""
        if (steps.length > 0) {
            let checks_counter = steps.reduce((total, step) => total + step.step_check, 0);
            let steps_elements = ""
            for (let i = 0; i < steps.length; i++) {
                let step_check = steps[i].step_check ? "checked" : ""
                let converted_step = this.appSettings.data.decode_text(steps[i].step_text)
                steps_elements +=
                    `<div class='step'>
                        <input type='checkbox' ${step_check} class='stepCheck'> 
                        <span class="step_text">${converted_step}</span>
                        <div class="stepId">${steps[i].id}</div>
                    </div>`
            }
            let category_color = ""
            if (category_id !== 0) {
                console.log(category_id)
                console.log(this.appSettings.data)
                console.log(this.appSettings.data.categories.categories)

                category_color = this.appSettings.data.categories.categories[category_id][0]
            }
            steps_HTML =
                `<div class='stepsShow'>
                    <img class='showImg' src='images/goals/down.png' alt="">
                    <span class="check_counter">
                        <span class="counter">${checks_counter}</span>/<span class="maxCounter">${steps.length}</span>
                    </span>
                </div>
                <div class='steps'>
                    ${steps_elements}
                </div>`
        }
        return steps_HTML
    }
}
