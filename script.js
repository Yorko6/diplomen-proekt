const ctx = document.getElementById('airChart').getContext('2d');
const airChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'],
        datasets: [{
            label: 'PM 2.5 нива',
            data: [12, 19, 15, 8, 10, 25, 10],
            borderColor: '#00ff88',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(0, 255, 136, 0.1)'
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: '#333' } },
            x: { grid: { color: '#333' } }
        }
    }
});