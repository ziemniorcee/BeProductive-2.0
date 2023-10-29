let press = false
let menu_state = false
let menu_sizes = [100, 200]
const downListener = () => {
    window.appAPI.startPosChange()
    press = true
}

const upListener = () => {
    window.appAPI.stopPosChange()
}
let element = document.getElementById("laurels")

element.addEventListener('mousedown', downListener)
element.addEventListener('mouseup', upListener)

element.addEventListener("dblclick", ()=>{
    window.appAPI.showFloatbarMenu()
    document.getElementById("goals").src="images/goal0.png"
})

document.getElementById("goals").addEventListener('click', (event) =>{
    window.appAPI.showGoals()
    window.appAPI.returnState((data)=>{
        document.getElementById("goals").src="images/goal"+Number(data)+".png"
    })
})