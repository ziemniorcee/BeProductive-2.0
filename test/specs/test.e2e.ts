import {$} from '@wdio/globals'


describe('Test start', () => {
    before(async () => {
        let length = await $$('.task').length
        await delete_todo(0, length)
        length = await $$('.task').length

        await show_yesterday()
        length = await $$('.task').length
        await delete_todo(0, length)

        let today_button = $('#dashMyDayBtn')
        await today_button.click()
    })

    it('Checks if testing works', async () => {
        const main_title = $('>>> #mainTitle')
        await expect(main_title).toHaveText("My day")
    })
})


describe('Input testing', () => {
    it('Simple input check', async () => {
        await add_todo_main('test')

        let length = await $$('.goals').length
        await expect(length).toBeGreaterThan(0)

        let todo_text = $$('.task')[0]
        await expect(todo_text).toHaveText('test')

        await delete_todo(0)
    })

    it('Special char input', async () => {
        let text_expected = 'br"k\'n'
        await add_todo_main(text_expected)

        let my_day_button = $('#dashMyDayBtn')
        await my_day_button.click()

        let todo_text = $$('.task')[0]
        await expect(todo_text).toHaveText(text_expected)

        await delete_todo(0)
    })
})

describe('Checking tests', ()=>{
    it('checkbox check', async () => {
        await add_todo_main('check')

        let todo_check = $$('.check_task')[0]
        await todo_check.click()

        let how_many_finished = await $('#todosFinished').$$('.goals').length
        await expect(how_many_finished).toBeGreaterThan(0)

        await delete_todo(0)
    })
})

describe('history', ()=>{
    it('drag from sidebar', async () => {
        await show_yesterday()

        await add_todo_main('drag yesterday 1')
        await add_todo_main('drag yesterday 2')

        let today_button = $('#dashMyDayBtn')
        await today_button.click()

        await add_todo_main('drag today')

        let side_history = $('#sideHistory')
        await side_history.click()

        let history_add = $$('.historyAdd')[0]
        await history_add.click()

        let history_task = $$('.historyTasks')[0]
        let target = await $('#todosArea')
        await history_task.dragAndDrop(target)


        let how_many_todos = await $$('.goals').length

        await expect(how_many_todos).toBeGreaterThan(2)

        let show_ids_button = await $('#testPanelShowIds')
        await show_ids_button.click()

        let task_ids = await $$('.todoId')
        await expect(task_ids[0]).toHaveText("0")
        await expect(task_ids[1]).toHaveText("2")
        await expect(task_ids[2]).toHaveText("1")

        await show_ids_button.click()

        await delete_todo(0, 3)

        let close_sidebar = $('#sidebarClose')
        await close_sidebar.click()
    })

    it('goal removing', async () => {
        await show_yesterday()

        await add_todo_main('remove yesterday')

        let today_button = $('#dashMyDayBtn')
        await today_button.click()

        let open_history = $("#sideHistory")
        await open_history.click()

        const history = $$('.sidebarTask')
        let expected_length = await history.length - 1

        await history[0].click({button: 2})
        const button_delete = $('#testPanelRemoveHistory')
        await button_delete.click()

        await expect(expected_length).toEqual(expected_length)

        let close_sidebar = $('#sidebarClose')
        await close_sidebar.click()
    })
})




describe('edit', () =>{
    it("main text", async () => {
        await add_todo_main("edit 1")

        let task = $$('.goals')[0]
        await task.click()

        const entry = $('#editText')
        await entry.setValue("edit changed")

        let rightbar = $('#rightbar')
        await rightbar.click()

        await expect(task).toHaveText("edit changed")

        await delete_todo(0)
    })

    it("new step", async () => {
        await add_todo_main("edit 2")

        let task = $$('.goals')[0]
        await task.click()

        let new_step = $('#editNewStep')
        await new_step.click()

        let step_entry = $$('.editTextStep')[0]
        await step_entry.setValue("step1")


        let rightbar = $('#rightbar')
        await rightbar.click()

        let step_text = task.$$('.step_text')[0]
        await expect(step_text).toHaveText("step1")

        await delete_todo(0)
    })

    it("change step text", async () => {
        await add_todo_main("edit 3")
        await add_todo_main("edit 4")

        let task = $$('.goals')
        await task[0].click()

        let new_step = $('#editNewStep')
        await new_step.click()

        let step_entry = $$('.editTextStep')[0]
        await step_entry.setValue("step1")

        await task[1].click()
        await task[0].click()
        step_entry = await $$('.editTextStep')[0]
        let step_text = task[0].$$('.step_text')[0]
        await expect(step_text).toHaveText("step1")

        await step_entry.addValue(" fixed")
        await task[1].click()

        await expect(step_text).toHaveText("step1 fixed")

        await delete_todo(0, 2)
    })

    it('change check', async() =>{
        await add_todo_main("edit 5")
        await add_todo_main("edit 6")

        let tasks_to_do = $('#todosArea').$$('.goals')
        await tasks_to_do[0].click()

        let edit_check = $('#editCheck')
        await edit_check.click()

        let tasks_done = $('#todosFinished').$$('.goals')
        let tasks_done_length = await tasks_done.length
        await expect(tasks_done[0]).toHaveText("edit 5")
        await expect(tasks_done_length).toEqual(1)

        await edit_check.click()
        let tasks_to_do_length = await tasks_to_do.length
        await expect(tasks_to_do_length).toEqual(2)


        await delete_todo(0, 2)
    })

    it('new step, the same goals click', async()=>{
        await add_todo_main("edit 7")

        let task = $$('.goals')
        await task[0].click()

        let new_step = $('#editNewStep')
        await new_step.click()

        let step_entry = $$('.editTextStep')[0]
        await step_entry.setValue("step1")

        await task[0].click()


        let edit_steps = await $$('.editStep')
        await expect(edit_steps.length).toEqual(1)

        await delete_todo(0)
    })


    // it('change difficulty and importance', async() =>{
    //     await add_todo_main("edit 9")
    //     await add_todo_main("edit 10")
    //     let tasks_to_do = $$('.goals')
    //     await tasks_to_do[0].click()
    //
    //
    //     const slider = await $('#editDiff')
    //     await browser.execute((sliderElement, value) => {
    //         sliderElement.value = value;       // Set the value of the range input
    //         sliderElement.dispatchEvent(new Event('input')); // Trigger input event
    //     }, slider, 0);
    //
    //     let rightbar = $('#rightbar')
    //     await rightbar.click()
    //
    //     let check_bg = $$('.todoCheck')[0]
    //
    //     await expect(check_bg.getCSSProperty('background-image')).toHaveText("edit 5")
    //
    //
    //     await delete_todo(0, 2)
    // })
})

describe('project sidebar', () =>{
    it('project sidebar test', async () => {
        let project_button = $$('.dashProject')[0]
        await project_button.click()

        await add_todo_main("project task")

        let my_day_button = $('#dashMyDayBtn')
        await my_day_button.click()

        await add_todo_main("main")

        let panel_show_sidebars = $("#testPanelShowSidebars")
        await panel_show_sidebars.click()

        let project_sidebar = $$('.projectType')[0]
        await project_sidebar.click()

        let project_task = $('#rightbar').$$('.goals')[0]
        let target = await $('#todosArea')
        await project_task.dragAndDrop(target)

        let how_many_todos = await $("#main").$$('.goals').length
        await expect(how_many_todos).toBeGreaterThan(1)

        let show_ids_button = await $('#testPanelShowIds')
        await show_ids_button.click()

        let task_ids = await $("#main").$$('.todoId')
        await expect(task_ids[0]).toHaveText("1")
        await expect(task_ids[1]).toHaveText("0")

        let close_project_sidebar = $('#sideProjectClose')
        await close_project_sidebar.click()

        await delete_todo(0, 2)
    })
})

describe('Day view testing', () => {
    it('ids after remove', async () => {
        await add_todo_main('remove task 1')
        await add_todo_main('remove task 2')

        await delete_todo(0)

        let show_ids_button = await $('#testPanelShowIds')
        await show_ids_button.click()

        let task_ids = await $$('.todoId')
        await expect(task_ids[0]).toHaveText("0")

        await delete_todo(0)
    })
})

describe('ideas', () => {
    it('input check', async () => {
        await add_todo_main("ideas")
        let idea_sidebar = $('#sideIdeas')
        await idea_sidebar.click()

        await add_idea("idea test")

        let ideas_add = $$('.ideasAdd')[0]
        await ideas_add.click()

        let how_many_todos = await $$('.goals').length
        await expect(how_many_todos).toBeGreaterThan(1)

        let show_ids_button = await $('#testPanelShowIds')
        await show_ids_button.click()

        let task_ids = await $$('.todoId')
        await expect(task_ids[0]).toHaveText("0")
        await expect(task_ids[1]).toHaveText("1")

        let close_sidebar = $('#sidebarClose')
        await close_sidebar.click()
        await delete_todo(0, 2)
    })

    it('goal removing', async () => {
        let idea_sidebar = $('#sideIdeas')
        await idea_sidebar.click()

        await add_idea("idea test")

        let ideas = $$('.sidebarTask')
        let expected_length = await ideas.length - 1

        await ideas[0].click({button: 2})

        const button_delete = $('#testPanelRemoveIdea')
        await button_delete.click()

        await expect(expected_length).toEqual(expected_length)

        let close_sidebar = $('#sidebarClose')
        await close_sidebar.click()
    })
})

async function show_yesterday() {
    let anotherday_button = $('#dashAnotherBtn')
    await anotherday_button.click()

    let current_day = $$('.ui-state-highlight')[0]
    let yesterday_id = await current_day.getText()

    let calendar_button = $$('.ui-state-default')[Number(yesterday_id) - 2] // doesnt work
    await calendar_button.click()
}

/**
 * Removes tasks from #todosAll
 * @param pos first task position in #todosAll
 * @param how_many how many to delete
 */
async function delete_todo(pos, how_many = 1) {
    for (let i = 0; i < how_many; i++) {
        const todo = $$('.goals')[pos]
        await todo.click({button: 2})
        const button_delete = $('#testPanelClear')
        await button_delete.click()
    }
}

/**
 * Adds new task
 * @param text tasks input
 */
async function add_todo_main(text) {
    const entry = $('#todoEntryGet')
    await entry.setValue(text)
    const todo_add_button = $('#todoAdd')
    await todo_add_button.click()
}
/**
 * Adds new idea
 * @param text tasks input
 */
async function add_idea(text) {
    const entry = $('#ideasEntry')
    await entry.setValue(text)
    const ideas_add_button = $('#ideasAdd')
    await ideas_add_button.click()
}