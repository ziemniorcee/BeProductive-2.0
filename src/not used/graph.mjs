let flag_graph_1 = true;
let flag_graph_2 = true;

/**
 * creates both of todays graphs and updates them
 */
export function create_today_graphs() {
    let date1 = new Date(l_date.today);
    let date2 = new Date();
    let date3 = new Date();
    date2.setDate(date1.getDate() - 5);
    date3.setDate(date1.getDate() - 10);
    const canv = $('#dashGraph1')[0].getContext('2d');
    const graph = new Chart(canv, {
        type: 'line',
        data: {
            labels: [date3.toLocaleDateString(), 
                    '', '', '', '', 
                    date2.toLocaleDateString(), 
                    '', '', '', '', 
                    date1.toLocaleDateString()],
            datasets: [{
                data: [3, 4, 6, 1, 7, 2, 9, 6, 13, 2],
                borderColor: 'rgba(41, 121, 255, 1)',
                borderWidth: 3,
                pointRadius: 0,
                backgroundColor: 'rgba(41, 121, 255, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false,
                    text: 'Productivity %',
                    font: {
                        size: 20
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    },
                    offset: false,
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    },
                    max: 120,
                    min: 0,
                    ticks: {
                        autoSkip: false,
                        stepSize: 10,
                        callback: function(value) {
                            if (value === 20) {
                                return '0%';
                            } else if (value === 70) {
                                return '50%';
                            } else if (value === 120) {
                                return '100%';
                            }
                            return '';
                        }
                    },
                },
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    function grow_graph_1() {
        if (!$('#dashGraph1BG').hasClass('expanded') && !$('#dashGraph2BG').hasClass('expanded') && flag_graph_1) {
            flag_graph_1 = false;
            $('#dashGraph2BG').toggle();
            $('#graphLine1').toggle();
            $('#dashMyDayBtn').toggle();
            graph.options.plugins.title.display = true;
            graph.options.scales.y.display = true;
            graph.options.scales.x.display = true;
            graph.update();
            $('#dashGraph1BG').toggleClass('expanded');
        }
    }

    $(document).on('mouseenter', '.dash-graph-1BG', () => {
        grow_graph_1();
    });

    function shrink_graph_1() {
        if ($('#dashGraph1BG').hasClass('expanded') && !$('#dashGraph2BG').hasClass('expanded') && !flag_graph_1) {
            graph.options.plugins.title.display = false;
            graph.options.scales.y.display = false;
            graph.options.scales.x.display = false;
            graph.update();
            $('#dashGraph1BG').toggleClass('expanded');
            setTimeout(function() {
                graph.resize();
                $('#dashGraph2BG').toggle();
                $('#graphLine1').toggle();
                $('#dashMyDayBtn').toggle();
                flag_graph_1 = true;
            }, 500);
        }
    }

    $(document).on('mouseleave', '.dash-graph-1BG', () => {
        shrink_graph_1();
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let dataset = context.dataset;
                            let total = dataset.data.reduce((sum, value) => sum + value, 0);
                            let currentValue = dataset.data[context.dataIndex];
                            let percentage = ((currentValue / total) * 100).toFixed(2);
                            return percentage + '%';
                        }
                    }
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
        },
    });

    
    function grow_graph_2() {
        if (!$('#dashGraph1BG').hasClass('expanded') && !$('#dashGraph2BG').hasClass('expanded') && flag_graph_2) {
            flag_graph_2 = false;
            $('#dashGraph1BG').toggle();
            $('#graphLine1').toggle();
            $('#dashMyDayBtn').toggle();
            graph2.options.plugins.title.display = true;
            graph2.options.scales.y.display = true;
            graph2.options.scales.x.display = true;
            graph2.update();
            $('#dashGraph2BG').toggleClass('expanded');
        }
    }

    $(document).on('mouseenter', '.dash-graph-2BG', () => {
        grow_graph_2();
    });

    function shrink_graph_2() {
        if (!$('#dashGraph1BG').hasClass('expanded') && $('#dashGraph2BG').hasClass('expanded') && !flag_graph_2) {
            graph2.options.plugins.title.display = false;
            graph2.options.scales.y.display = false;
            graph2.options.scales.x.display = false;
            graph2.update();
            $('#dashGraph2BG').toggleClass('expanded');
            setTimeout(function() {
                graph2.resize();
                $('#dashGraph1BG').toggle();
                $('#graphLine1').toggle();
                $('#dashMyDayBtn').toggle();
                flag_graph_2 = true;
            }, 500);
        }
    }
    
    $(document).on('mouseleave', '.dash-graph-2BG', () => {
        shrink_graph_2();
    });

    let prev_day = new Date(l_date.today);
    let dates = [l_date.sql_format(prev_day)];
    for (let i=0; i<11; i++) {
        prev_day.setDate(prev_day.getDate() - 1);
        dates.push(l_date.sql_format(prev_day));
    }
    window.goalsAPI.askProductivity(dates);
    window.goalsAPI.askCategoriesCounts();
}

window.goalsAPI.getProductivity((productivities) => update_productivity_graph(productivities));

/**
 * updates first graph with given data of last days productivity
 * @param productivities number of productivities in last 11 days
 */
function update_productivity_graph(productivities) {
    let ctx = $('#dashGraph1')[0].getContext('2d');
    let chart = Chart.getChart(ctx);
    productivities.pop();
    productivities.reverse();
    for (let i=0; i<productivities.length; i++) {
        productivities[i] += 20;
    }
    chart.data.datasets[0].data = productivities;
    chart.update();
}

window.goalsAPI.getCategoriesCounts((counts) => update_categories_graph(counts));

/**
 * updates second graph with given data of categories tasks quantity
 * @param counts quantities of tasks in each category
 */
function update_categories_graph(counts) {
    let ctx = $('#dashGraph2')[0].getContext('2d');
    let chart = Chart.getChart(ctx);
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



