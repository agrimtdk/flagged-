import os
import random
import uuid
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from ml.configs import config


def generate_synthetic_dataset(num_rows: int = 10000, fraud_ratio: float = 0.035) -> pd.DataFrame:
    """
    Generates a highly realistic, imbalanced synthetic transaction dataset
    matching the API schema and SDD parameters, ensuring patterns are learnable.
    """
    np.random.seed(config.RANDOM_SEED)
    random.seed(config.RANDOM_SEED)
    
    # Pre-defined categorical distributions
    card_brands = ["VISA", "MASTERCARD", "AMERICAN EXPRESS", "DISCOVER"]
    card_probs = [0.60, 0.30, 0.07, 0.03]
    
    countries = ["USA", "CAN", "GBR", "FRA", "DEU", "IND", "CHN", "MEX"]
    country_probs = [0.70, 0.08, 0.07, 0.04, 0.03, 0.04, 0.02, 0.02]
    
    device_types = ["desktop", "mobile", "tablet"]
    device_probs = [0.55, 0.40, 0.05]
    
    email_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "acme.com", "startup.io", "anonymous.org"]
    domain_probs = [0.50, 0.20, 0.12, 0.08, 0.05, 0.03, 0.02]
    
    data = []
    start_time = datetime.now(timezone.utc) - timedelta(days=30)
    
    for i in range(num_rows):
        tx_id = f"tx_{1000000 + i}"
        amount = np.round(np.random.lognormal(mean=3.8, sigma=1.0) + 1.0, 2)
        card_brand = np.random.choice(card_brands, p=card_probs)
        billing_country = np.random.choice(countries, p=country_probs)
        
        # Introduce country mismatch with 5% base probability
        if random.random() < 0.05:
            card_country = random.choice([c for c in countries if c != billing_country])
        else:
            card_country = billing_country
            
        ip_addr = f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
        device_type = np.random.choice(device_types, p=device_probs)
        email_domain = np.random.choice(email_domains, p=domain_probs)
        
        # Distribute created_at timestamps over 30 days
        created_at = (start_time + timedelta(seconds=random.randint(0, 30 * 86400))).isoformat()
        
        # Fraud Logic Rules (injecting learnable patterns)
        is_fraud = 0
        fraud_prob = 0.005 # Base very low risk
        
        # Rule 1: Country mismatch raises risk significantly
        if billing_country != card_country:
            fraud_prob += 0.35
            
        # Rule 2: Very high transaction amounts raise risk
        if amount > 1500.0:
            fraud_prob += 0.25
        elif amount > 500.0:
            fraud_prob += 0.08
            
        # Rule 3: Risky email domain
        if email_domain == "anonymous.org":
            fraud_prob += 0.40
        elif email_domain in ["hotmail.com", "yahoo.com"] and amount > 300.0:
            fraud_prob += 0.12
            
        # Rule 4: Mobile charges with high values
        if device_type == "mobile" and amount > 400.0:
            fraud_prob += 0.15
            
        # Sample final fraud label based on combined risk probability
        if random.random() < min(0.95, fraud_prob):
            is_fraud = 1
            
        data.append({
            "transaction_external_id": tx_id,
            "amount": amount,
            "card_brand": card_brand,
            "billing_country": billing_country,
            "ip_address": ip_addr,
            "device_type": device_type,
            "email_domain": email_domain,
            "card_country": card_country,
            "created_at": created_at,
            "is_fraud": is_fraud
        })
        
    df = pd.DataFrame(data)
    
    # 5. Inject some missing values (similar to real-world transactions)
    # 2% missing values in device_type and card_brand
    for col in ["device_type", "card_brand"]:
        mask = np.random.rand(*df[col].shape) < 0.02
        df.loc[mask, col] = np.nan
        
    # Inject 10 duplicate rows to test validator
    duplicates = df.sample(n=10, random_state=config.RANDOM_SEED)
    df = pd.concat([df, duplicates], ignore_index=True)
    
    return df


def load_raw_dataset(num_rows: int = 10000) -> pd.DataFrame:
    """
    Checks if raw transactions CSV exists. If not, generates the synthetic dataset
    and writes it to RAW_DATA_PATH. Returns the DataFrame.
    """
    if os.path.exists(config.RAW_DATA_PATH):
        print(f"Loading raw dataset from {config.RAW_DATA_PATH}...")
        return pd.read_csv(config.RAW_DATA_PATH)
        
    print(f"Raw dataset not found at {config.RAW_DATA_PATH}. Generating synthetic transaction log...")
    os.makedirs(config.DATA_DIR, exist_ok=True)
    
    df = generate_synthetic_dataset(num_rows=num_rows)
    df.to_csv(config.RAW_DATA_PATH, index=False)
    print(f"Synthetic dataset of size {df.shape} written to {config.RAW_DATA_PATH}.")
    return df


if __name__ == "__main__":
    load_raw_dataset()
