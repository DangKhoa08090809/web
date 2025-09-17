let latestData = {};
let baseURL = window.location.hostname;

// Lưu lịch sử để vẽ biểu đồ
let historyData = {
    labels: [],
    temp: [],
};

let chartInstance = null;

async function getData() {
    try {
        let response = await fetch(`http://${baseURL}:5000/analyze`);
        let data = await response.json();
        if (!data.error) {
            latestData = data;

            // Thêm dữ liệu mới vào lịch sử
            let now = new Date().toLocaleTimeString();
            historyData.labels.push(now);
            historyData.temp.push(data.temperature);

            if (historyData.labels.length > 10) {
                historyData.labels.shift();
                historyData.temp.shift();
            }

            // Update chart nếu đang mở Statistic
            if (chartInstance) {
                chartInstance.data.labels = historyData.labels;
                chartInstance.data.datasets[0].data = historyData.temp;
                chartInstance.update();
            }

            // 🔥 Update text nếu đang mở modal Statistic
            const modal = document.getElementById("myModal");
            const title = document.getElementById("modal-title");
            const body = document.getElementById("modal-body");

            if (
                modal.style.display === "flex" &&
                title.innerText.includes("Vehicle Statistics")
            ) {
                body.innerText =
                    `🔋 Battery: ${latestData.battery_voltage} V\n` +
                    `⚡ Alternator: ${latestData.alternator_voltage} V\n` +
                    `🌡 Temp: ${latestData.temperature} °C\n` +
                    `⛽ Fuel Inst: ${latestData.fuel_instant} L/100km\n` +
                    `⛽ Fuel Avg: ${latestData.fuel_avg} L/100km\n` +
                    `🛞 Odometer: ${latestData.odometer} km`;
            }
        }
    } catch (e) {
        console.error("Lỗi lấy dữ liệu:", e);
    }
}

function openModal(type) {
    const modal = document.getElementById("myModal");
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const chartCanvas = document.getElementById("statsChart");

    if (type === "stats") {
        title.innerText = "📈 Vehicle Statistics";
        body.innerText =
            `🔋 Battery: ${latestData.battery_voltage} V\n` +
            `⚡ Alternator: ${latestData.alternator_voltage} V\n` +
            `🌡 Temp: ${latestData.temperature} °C\n` +
            `⛽ Fuel Inst: ${latestData.fuel_instant} L/100km\n` +
            `⛽ Fuel Avg: ${latestData.fuel_avg} L/100km\n` +
            `🛞 Odometer: ${latestData.odometer} km`;

        chartCanvas.style.display = "block"; // 🔥 hiện chart

        // Tạo chart nếu chưa có
        if (!chartInstance) {
            chartInstance = new Chart(chartCanvas, {
                type: "line",
                data: {
                    labels: historyData.labels,
                    datasets: [
                        {
                            label: "Engine Temp (°C)",
                            data: historyData.temp,
                            borderColor: "red",
                            borderWidth: 2,
                            tension: 0.3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // 🔥 Cho phép canvas full container
                    plugins: {
                        legend: { display: true },
                    },
                    scales: {
                        x: { ticks: { color: "#fff" } },
                        y: { ticks: { color: "#fff" } },
                    },
                },
            });
        }
    } else {
        chartCanvas.style.display = "none"; // 🔥 ẩn chart nếu không phải stats

        if (type === "alerts") {
            title.innerText = "⚠️ Alerts";
            body.innerText = latestData.alerts?.length
                ? latestData.alerts.join("\n")
                : "Không có cảnh báo";
        }
        if (type === "maintenance") {
            title.innerText = "🛠️ Maintenance";
            body.innerText = latestData.maintenance?.length
                ? latestData.maintenance.join("\n")
                : "Chưa cần";
        }
    }

    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

// Auto update data
setInterval(getData, 5000);
getData();
