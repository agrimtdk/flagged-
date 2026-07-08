#!/usr/bin/env python3
"""
FLAGGED! Real-Time Live API Stream Simulator
Streams realistic transactions to your live or local FLAGGED! endpoint.
"""

from datetime import datetime
import random
import time
import uuid
import requests

# =====================================================================
# 1. CONFIGURATION
# =====================================================================
# Set to your live production endpoint (or http://localhost:8000/api/v1/predict)
API_URL = ""

# Paste your API Key generated from FLAGGED! Dashboard -> API Keys
API_KEY = ""

# The dataset name that will appear in your Dashboard data switcher
SESSION_NAME = "Live Production Feed"

# =====================================================================
# 2. REALISTIC TRANSACTION SIMULATION POOLS
# =====================================================================
BRANDS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"]
DEVICES = ["desktop", "mobile", "tablet"]
STANDARD_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "icloud.com",
    "live.com",
]
HIGH_RISK_DOMAINS = [
    "tempmail.org",
    "trashmail.com",
    "10minutemail.com",
    "sharklasers.com",
]
COUNTRIES = ["USA", "GBR", "CAN", "DEU", "FRA", "AUS", "JPN"]
HIGH_RISK_COUNTRIES = ["RUS", "CHN", "NGA", "BRA"]


def generate_random_ip():
    return f"{random.randint(11, 199)}.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"


def generate_transaction():
    """Generates a realistic transaction payload (approx 15% fraud rate)."""
    is_suspicious = random.random() < 0.15
    billing_country = random.choice(COUNTRIES)

    if is_suspicious:
        # Simulate fraud indicators: IP/Card Country mismatch, high amount, or disposable email
        card_country = (
            random.choice(HIGH_RISK_COUNTRIES)
            if random.random() < 0.7
            else billing_country
        )
        email_domain = (
            random.choice(HIGH_RISK_DOMAINS)
            if random.random() < 0.5
            else random.choice(STANDARD_DOMAINS)
        )
        amount = round(random.uniform(650.0, 4800.0), 2)
    else:
        # Legitimate customer transaction
        card_country = billing_country
        email_domain = random.choice(STANDARD_DOMAINS)
        amount = round(random.uniform(14.99, 320.00), 2)

    return {
        "transaction_external_id": f"TXN-LIVE-{uuid.uuid4().hex[:8].upper()}",
        "amount": amount,
        "card_brand": random.choice(BRANDS),
        "billing_country": billing_country,
        "ip_address": generate_random_ip(),
        "device_type": random.choice(DEVICES),
        "email_domain": email_domain,
        "card_country": card_country,
        "session_name": SESSION_NAME,
    }


def main():
    if API_KEY == "PASTE_YOUR_API_KEY_HERE":
        print(
            "⚠️  ERROR: Please set your API_KEY variable at line 17 of live_feed_simulator.py!"
        )
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    print("=" * 75)
    print(f"🚀 STARTING LIVE TRANSACTION STREAM TO: {API_URL}")
    print(f"📁 Dashboard Collection Name: '{SESSION_NAME}'")
    print("Press Ctrl+C at any time to stop the live stream.")
    print("=" * 75)

    count = 0
    try:
        while True:
            count += 1
            payload = generate_transaction()

            try:
                start_time = time.perf_counter()
                response = requests.post(
                    API_URL, json=payload, headers=headers, timeout=10
                )
                latency_ms = (time.perf_counter() - start_time) * 1000.0

                if response.status_code == 200:
                    data = response.json()
                    risk_score = data.get("risk_score", 0.0)
                    is_fraud = data.get("is_fraud", False)
                    tx_id = payload["transaction_external_id"]
                    amount = payload["amount"]

                    if is_fraud:
                        status = "🚨 FLAGGED [HIGH RISK]"
                        score_str = f"{risk_score*100:5.1f}%"
                    else:
                        status = "✅ VERIFIED [CLEAN]    "
                        score_str = f"{risk_score*100:5.1f}%"

                    print(
                        f"[{datetime.now().strftime('%H:%M:%S')}] #{count:03d} | {status} | Risk: {score_str} | ${amount:7.2f} | {tx_id} ({latency_ms:.1f}ms)"
                    )
                elif response.status_code == 401:
                    print(
                        "❌ AUTH ERROR (401): Invalid API Key! Please verify your API_KEY at line 17."
                    )
                    break
                else:
                    print(
                        f"⚠️  SERVER ERROR ({response.status_code}): {response.text}"
                    )

            except requests.exceptions.RequestException as e:
                print(f"❌ CONNECTION ERROR: {e}")
                time.sleep(3)

            # Random interval between 1.0s and 3.0s to simulate organic customer traffic
            time.sleep(random.uniform(1.0, 3.0))

    except KeyboardInterrupt:
        print("\n" + "=" * 75)
        print(f"🛑 STREAM STOPPED. Total transactions evaluated: {count - 1}")
        print(
            f"👉 Open your web dashboard and select '{SESSION_NAME}' in the dataset switcher!"
        )
        print("=" * 75)


if __name__ == "__main__":
    main()
