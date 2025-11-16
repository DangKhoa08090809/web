let latestData = {};
let baseURL = window.location.hostname;

// Store history for charts
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

            // Add new data to history
            let now = new Date().toLocaleTimeString();
            historyData.labels.push(now);
            historyData.temp.push(data.temperature);

            // Limit history to the last 10 entries
            if (historyData.labels.length > 10) {
                historyData.labels.shift();
                historyData.temp.shift();
            }

            // Update chart if it's currently visible
            if (chartInstance) {
                chartInstance.data.labels = historyData.labels;
                chartInstance.data.datasets[0].data = historyData.temp;
                chartInstance.update();
            }

            // ✅ FIXED: Only update text content, do not remove or hide elements here.
            // This prevents destroying HTML elements needed by other modals.
            const modal = document.getElementById("myModal");
            const title = document.getElementById("modal-title");
            if (
                modal.style.display === "flex" &&
                title.innerText.includes("Vehicle Statistics")
            ) {
                const modalText = document.getElementById("modalText");
                if (modalText) {
                    modalText.innerText =
                        `🔋 Battery: ${latestData.battery_voltage} V\n` +
                        `⚡ Alternator: ${latestData.alternator_voltage} V\n` +
                        `🌡 Temp: ${latestData.temperature} °C\n` +
                        `⛽ Fuel Inst: ${latestData.fuel_instant} L/100km\n` +
                        `⛽ Fuel Avg: ${latestData.fuel_avg} L/100km\n` +
                        `🛞 Odometer: ${latestData.odometer} km`;
                }
            }
        }
    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

function openModal(type) {
    const modal = document.getElementById("myModal");
    const title = document.getElementById("modal-title");
    const chatBox = document.getElementById("chatBox");
    const maintenanceList = document.getElementById("maintenanceList");
    const modalText = document.getElementById("modalText");
    const chartContainer = document.querySelector(".chart-container");

    // Reset all optional sections first
    if (chartContainer) chartContainer.style.display = "none";
    if (chatBox) chatBox.style.display = "none";
    if (maintenanceList) maintenanceList.style.display = "none"; // Hide instead of clearing innerHTML here
    if (modalText) modalText.innerText = "";

    if (type === "stats") {
        title.innerText = "📈 Vehicle Statistics";

        // Update stats text
        modalText.innerText =
            `🔋 Battery: ${latestData.battery_voltage || "N/A"} V\n` +
            `⚡ Alternator: ${latestData.alternator_voltage || "N/A"} V\n` +
            `🌡 Temp: ${latestData.temperature || "N/A"} °C\n` +
            `⛽ Fuel Inst: ${latestData.fuel_instant || "N/A"} L/100km\n` +
            `⛽ Fuel Avg: ${latestData.fuel_avg || "N/A"} L/100km\n` +
            `🛞 Odometer: ${latestData.odometer || "N/A"} km`;

        // Handle the chart
        if (chartContainer) chartContainer.style.display = "block";
        const chartCanvas = document.getElementById("statsChart");

        if (!chartCanvas) {
            console.error("❌ Cannot find #statsChart element in the DOM!");
            return;
        }

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
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true } },
                    scales: {
                        x: { ticks: { color: "#fff" } },
                        y: { ticks: { color: "#fff" } },
                    },
                },
            });
        }
    } else if (type === "alerts") {
        title.innerText = "⚠️ Alerts";
        modalText.innerText = latestData.alerts?.length
            ? latestData.alerts.join("\n")
            : "🚗 No alerts.";
    } else if (type === "maintenance") {
        title.innerText = "🛠️ Maintenance";
        const maintenance = latestData.maintenance ?? [];

        if (maintenanceList) {
            maintenanceList.style.display = "block";
            maintenanceList.innerHTML = maintenance.length
                ? maintenance.map((item) => `• ${item}`).join("<br>")
                : "🚗 No maintenance suggestions.";
        }

        modalText.innerText = "💬 Chat with the technical assistant:";
        if (chatBox) chatBox.style.display = "flex";
    }

    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

// ⚙️ Chat Function
async function sendMessage() {
    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");

    if (!input.value.trim()) return;

    // Display user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message user";
    userMsg.innerText = input.value;
    messages.appendChild(userMsg);

    // Gọi Flask server
    let responsechat = await fetch(`http://${baseURL}:5000/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value }),
    });

    const data = await responsechat.json();

    const botMsg = document.createElement("div");
    botMsg.className = "chat-message bot";
    botMsg.innerText = data.reply || "❌ Lỗi khi gọi Gemini.";
    messages.appendChild(botMsg);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;
}

// XÓA TOÀN BỘ HÀM NÀY (hàm login cứng)
/*
function login() {
    const user = ...
    ...
    window.location.href = "/dashboard";
}
*/

// GIỮ LẠI VÀ SỬA HÀM NÀY (dùng fetch)
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMessage");

    if (!username || !password) {
        msg.style.color = "red";
        msg.textContent = "Vui lòng nhập đầy đủ!";
        return;
    }

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include", // ← Quan trọng: gửi session cookie
        });

        const data = await res.json();

        if (data.success) {
            msg.style.color = "lime";
            msg.textContent = "Đăng nhập thành công!";
            setTimeout(() => {
                window.location.reload(); // ← TẢI LẠI TRANG → session được áp dụng
            }, 800);
        } else {
            msg.style.color = "red";
            msg.textContent = data.message || "Lỗi đăng nhập";
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "Lỗi kết nối server!";
    }
}

async function updateAuthButton() {
    const btn = document.getElementById("authBtn");

    const res = await fetch("/me", { credentials: "include" });
    const data = await res.json();

    if (data.logged_in) {
        btn.textContent = "Log out";
        btn.onclick = logout;
    } else {
        btn.textContent = "Log in";
        btn.onclick = openLoginModal;
    }
}

async function logout() {
    await fetch("/logout", { credentials: "include" });
    window.location.reload();
}

// chạy khi trang load
updateAuthButton();
function openLoginModal() {
    document.getElementById("loginModal").style.display = "flex";
}

function closeLoginModal() {
    document.getElementById("loginModal").style.display = "none";
}

// Auto update data
setInterval(getData, 5000);
getData();
