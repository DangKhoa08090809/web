from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

latest_data = {}

# Route chính -> render index.html
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze_post():
    global latest_data
    data = request.get_json()

    battery_voltage = data.get("battery_voltage")
    alternator_voltage = data.get("alternator_voltage")
    temperature = data.get("temperature")
    fuel_instant = data.get("fuel_instant")
    fuel_avg = data.get("fuel_avg")
    odometer = data.get("odometer", 0)

    alerts = []
    maintenance = []

    # --- Điện áp ---
    if battery_voltage < 12.0:
        alerts.append("⚠️ Điện áp ắc quy thấp!")
    else:
        alerts.append("✅ Điện áp ắc quy bình thường.")

    if alternator_voltage < 13.5:
        alerts.append("⚠️ Máy phát điện có vấn đề!")
    else:
        alerts.append("✅ Hệ thống sạc hoạt động tốt.")

    # --- Nhiệt độ ---
    if temperature > 105:
        alerts.append(f"🔥 Cảnh báo: Nhiệt độ động cơ quá cao ({temperature}°C)!")
    elif temperature < 70:
        alerts.append(f"❄️ Động cơ chưa đủ nhiệt ({temperature}°C).")
    else:
        alerts.append(f"🌡 Nhiệt độ động cơ ổn định ({temperature}°C).")

    # --- Nhiên liệu ---
    if fuel_instant and fuel_avg:
        if fuel_instant > fuel_avg * 1.3:
            alerts.append(f"⛽ Tiêu hao nhiên liệu bất thường: {fuel_instant} L/100km (trung bình {fuel_avg})")
        else:
            alerts.append(f"⛽ Mức tiêu hao nhiên liệu ổn định ({fuel_instant} L/100km)")

    # --- Bảo dưỡng ---
    if odometer > 5000:
        maintenance.append("🛠️ Đến hạn thay dầu nhớt.")
    if odometer > 10000:
        maintenance.append("🛠️ Kiểm tra & vệ sinh lọc gió.")
    if odometer > 15000:
        maintenance.append("🛠️ Thay bugi.")
    if odometer > 20000:
        maintenance.append("🛠️ Kiểm tra nước làm mát.")

    latest_data = {
        "battery_voltage": battery_voltage,
        "alternator_voltage": alternator_voltage,
        "temperature": temperature,
        "fuel_instant": fuel_instant,
        "fuel_avg": fuel_avg,
        "odometer": odometer,
        "alerts": alerts,
        "maintenance": maintenance
    }

    return jsonify({"message": "Dữ liệu đã cập nhật thành công"})


@app.route("/analyze", methods=["GET"])
def analyze_get():
    if not latest_data:
        return jsonify({"error": "Chưa có dữ liệu nào từ simulator"}), 400
    return jsonify(latest_data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
