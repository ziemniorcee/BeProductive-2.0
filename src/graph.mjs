import {l_date} from "./date.js";
import { categories } from "./data.mjs";

export function create_today_graphs() {
    const canv = $('#dashGraph1')[0].getContext('2d');
    const graph = new Chart(canv, {
        type: 'line',
        data: {
            labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            datasets: [{
                data: [3, 4, 6, 1, 7, 2, 9, 6, 13, 2],
                borderColor: 'rgba(249, 67, 64, 1)',
                borderWidth: 3,
                pointRadius: 0,
                backgroundColor: 'rgba(224, 193, 199, 1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    },
                    max: 100,
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });


    const canv2 = $('#dashGraph2')[0].getContext('2d');
    const graph2 = new Chart(canv2, {
        type: 'pie',
        data: {
            labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            datasets: [{
                data: [3, 4, 6, 1, 7, 2, 9, 6, 13, 2],
                borderWidth: 0,
                backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)',
                    'rgba(255, 99, 71, 1)',
                    'rgba(139, 69, 19, 1)',
                    'rgba(60, 179, 113, 1)'
                ],
                fill: false,
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    },
                    ticks: {
                        max: 30
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
    console.log("lolol1");
    let prev_day = new Date(l_date.today);
    let dates = [l_date.sql_format(prev_day)];
    for (let i=0; i<10; i++) {
        prev_day.setDate(prev_day.getDate() - 1);
        dates.push(l_date.sql_format(prev_day));
    }
    window.goalsAPI.askProductivity(dates);
    window.goalsAPI.askCategoriesCounts();
    console.log("lolol2");
}

window.goalsAPI.getProductivity((productivities) => update_productivity_graph(productivities));

function update_productivity_graph(productivities) {
    let ctx = $('#dashGraph1')[0].getContext('2d');
    let chart = Chart.getChart(ctx);
    productivities.pop();
    productivities.reverse();
    chart.data.datasets[0].data = productivities;
    chart.update();
}

window.goalsAPI.getCategoriesCounts((counts) => update_categories_graph(counts));

function update_categories_graph(counts) {
    let ctx = $('#dashGraph2')[0].getContext('2d');
    let chart = Chart.getChart(ctx);
    for (let val of counts) {
        console.log(val);
    }
    let colors = [];
    let names = [];
    let quantities = [];
    for (let c of counts) {
        colors.push(categories[c.category][0]);
        names.push(categories[c.category][1]);
        quantities.push(c.counts);
    }
    chart.data.datasets[0].data = quantities;
    chart.data.labels = names;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
}

