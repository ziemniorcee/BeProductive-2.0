export function todo_html (main_goal, check_state, steps_html){
    let html =
        `<div id="closeEdit">⨉</div>
        <div id="todoEdit">
            <div id="editMain">
                <input type="checkbox" id="editCheck" ${check_state}>
                <input type="text" id="editText" value="${main_goal}" spellcheck="false">
            </div>
            <div id="editSteps">
                ${steps_html}
                <div id="editNewStep">
                    <span>+</span>New Step
                </div>
            </div>
        </div>
        <div id="editOptions">
            <div id="optionsNames">
                <div>Category</div>
                <div>Difficulty</div>
                <div>Importance</div>
            </div>
            <div id="optionsConfig">
                <div id="selectCategory2" class="selectCategory">None</div>
                <input type="range" class="r_todo"  max="99">
                <input type="range" class="r_todo"  max="99">
                <div class="categoryPicker" id="categoryPicker2">
                    <div class="category">
                        <span class="categoryButton"></span>
                        <span class="categoryName">None</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #32174D"></span>
                        <span class="categoryName">Work</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #002244"></span>
                        <span class="categoryName">School</span>
                    </div>
                    <div class="category">
                        <span class="categoryButton" style="background: #023020"></span>
                        <span class="categoryName">House</span>
                    </div>
                </div>
            </div>
        </div>`
    return html;
}