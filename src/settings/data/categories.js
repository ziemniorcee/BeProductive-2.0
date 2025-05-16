export class CategoriesSettings {
    constructor(app_data) {
        this.app_data = app_data
        this.categories = {}
        this.categories2 = {}
    }

    async init() {
        this.categories = {};
        this.categories2 = {};

        let categories_data = await window.dataAPI.getCategories();
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
}
