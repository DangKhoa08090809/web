import requests
import random
import time

URL = "http://127.0.0.1:5000/analyze"

def simulate_data():
    return {
        "battery_voltage": round(random.uniform(11.0, 14.5), 2),
        "alternator_voltage": round(random.uniform(12.0, 14.5), 2),
        "temperature": round(random.uniform(60, 120), 1),   # °C
        "fuel_instant": round(random.uniform(2.5, 7.0), 2), # L/100km
        "fuel_avg": 4.5,                                    # trung bình
        "odometer": random.randint(1000, 25000)             # km
    }

while True:
    data = simulate_data()
    try:
        response = requests.post(URL, json=data)
        if response.status_code == 200:
            print("\n📡 Dữ liệu gửi:", data)
            print("✅ Kết quả phân tích:", response.json())
        else:
            print("❌ Lỗi:", response.text)
    except Exception as e:
        print("⚠️ Không kết nối được tới server:", e)

    time.sleep(10)  # gửi mỗi 10 giây
