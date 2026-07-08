import time
import random
import uuid
import requests
from datetime import datetime

# =====================================================================
# 1. CONFIGURATION - PASTE YOUR API KEY HERE
# =====================================================================
API_KEY = ""  # e.g., "flg_live_abc123..."
URL = "http://localhost:8000/api/v1/predict"
SESSION_NAME = "Live API Stream Demo"  # This will appear in your Data Collection switcher

# =====================================================================
# 2. RANDOM DATA POOLS FOR SIMULATION
# =====================================================================
BRANDS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"]
DEVICES = ["desktop", "mobile", "tablet"]
STANDARD_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "live.com"]
HIGH_RISK_DOMAINS = ["tempmail.org", "trashmail.com", "10minutemail.com", "sharklasers.com"]
COUNTRIES = ["USA", "GBR", "CAN", "DEU", "FRA", "AUS", "JPN", "IND"]
HIGH_RISK_COUNTRIES = ["RUS", "CHN", "NGA", "BRA"]

def generate_random_ip():
    return f"{random.randint(11, 199)}.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"

def generate_transaction():
    """Generates a realistic randomized transaction payload."""
    # Decide if we want to intentionally simulate a suspicious transaction (approx 15% chance)
    is_suspicious = random.random() < 0.15
    
    billing_country = random.choice(COUNTRIES)
    
    if is_suspicious:
        # Simulate fraud drivers: mismatching country, large amount, or disposable email
        card_country = random.choice(HIGH_RISK_COUNTRIES) if random.random() < 0.7 else billing_country
        email_domain = random.choice(HIGH_RISK_DOMAINS) if random.random() < 0.5 else random.choice(STANDARD_DOMAINS)
        amount = round(random.uniform(500.0, 4500.0), 2)
    else:
        # Standard legitimate transaction: matching country, normal amount, trusted email
        card_country = billing_country
        email_domain = random.choice(STANDARD_DOMAINS)
        amount = round(random.uniform(12.50, 350.00), 2)
        
    return {
        "dataset_name": SESSION_NAME,
        "transaction_external_id": f"TXN-STREAM-{uuid.uuid4().hex[:8].upper()}",
        "amount": amount,
        "card_brand": random.choice(BRANDS),
        "billing_country": billing_country,
        "ip_address": generate_random_ip(),
        "device_type": random.choice(DEVICES),
        "email_domain": email_domain,
        "card_country": card_country
    }

def main():
    if API_KEY == "PASTE_YOUR_API_KEY_HERE":
        print("⚠️  ERROR: Please paste your API Key into the API_KEY variable at the top of the script!")
        return

    # FastAPI requires the Authorization header in the format: Bearer <token_or_api_key>
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    print("=" * 70)
    print(f"🚀 STARTING LIVE TRANSACTION STREAM TO: {URL}")
    print(f"📁 Dashboard Collection Name: '{SESSION_NAME}'")
    print("Press Ctrl+C at any time to stop the stream.")
    print("=" * 70)
    
    count = 0
    try:
        while True:
            count += 1
            payload = generate_transaction()
            
            try:
                start_time = time.perf_counter()
                response = requests.post(URL, json=payload, headers=headers, timeout=5)
                latency_ms = (time.perf_counter() - start_time) * 1000.0
                
                if response.status_code == 200:
                    data = response.json()
                    risk_score = data.get("risk_score", 0.0)
                    is_fraud = data.get("is_fraud", False)
                    tx_id = payload["transaction_external_id"]
                    amount = payload["amount"]
                    
                    # Format visual status
                    if is_fraud:
                        status = "🚨 FLAGGED [HIGH RISK]"
                        score_str = f"{risk_score*100:5.1f}%"
                    else:
                        status = "✅ VERIFIED [CLEAN]    "
                        score_str = f"{risk_score*100:5.1f}%"
                        
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] #{count:03d} | {status} | Score: {score_str} | ${amount:7.2f} | TxID: {tx_id} ({latency_ms:.1f}ms)")
                elif response.status_code == 401:
                    print(f"❌ AUTH ERROR (401): Invalid API Key! Please check your API_KEY.")
                    break
                elif response.status_code == 429:
                    print(f"⚠️  RATE LIMIT EXCEEDED (429): Sleeping for 5 seconds before retrying...")
                    time.sleep(5)
                else:
                    print(f"⚠️  SERVER ERROR ({response.status_code}): {response.text}")
                    
            except requests.exceptions.ConnectionError:
                print("❌ CONNECTION ERROR: Could not connect to http://localhost:8000. Is the backend server running?")
                time.sleep(3)
                
            # Random delay between 0.8 and 2.5 seconds to simulate real-world incoming traffic
            time.sleep(random.uniform(0.8, 2.5))
            
    except KeyboardInterrupt:
        print("\n" + "=" * 70)
        print(f"🛑 STREAM STOPPED BY USER. Total transactions evaluated: {count - 1}")
        print(f"👉 Go to your website dashboard and select '{SESSION_NAME}' in the Data Collection switcher!")
        print("=" * 70)

if __name__ == "__main__":
    main()