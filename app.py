from flask import Flask, request, jsonify, render_template, session, redirect, url_for, make_response
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import os
import uuid
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app, supports_credentials=True)
app.secret_key = "your_secret_key_here"  # để Flask lưu session


latest_data = {}

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
    user_id = request.cookies.get("user_id")
    if not user_id:
        return jsonify({"error": "Bạn chưa đăng nhập"}), 403

    if not latest_data:
        return jsonify({"error": "Chưa có dữ liệu nào từ simulator"}), 400

    return jsonify(latest_data)

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.get_json().get("message", "")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content(user_input)

    return jsonify({"reply": response.text})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "1234":
        # tạo user_id duy nhất
        user_id = str(uuid.uuid4())

        # tạo response
        resp = make_response(jsonify({"success": True, "user_id": user_id}))

        # lưu cookie sống 30 ngày
        resp.set_cookie(
            "user_id",
            user_id,
            max_age=60 * 60 * 24 * 30,  # 30 ngày
            httponly=True,
            samesite="Lax"
        )

        return resp

    return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

@app.route("/logout", methods=["GET"])
def logout():
    resp = make_response(jsonify({"success": True}))
    resp.set_cookie("user_id", "", expires=0)  # xoá cookie
    return resp

@app.route("/")
def index():
    user_id = request.cookies.get("user_id")

    logged_in = user_id is not None

    return render_template("index.html", logged_in=logged_in)

@app.route("/me", methods=["GET"])
def me():
    user_id = request.cookies.get("user_id")

    if user_id:
        return jsonify({"logged_in": True, "user_id": user_id})

    return jsonify({"logged_in": False})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)