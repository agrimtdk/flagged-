import pandas as pd
import numpy as np
from datetime import datetime
from ml.configs import config


class PreprocessorPipeline:
    def __init__(self):
        # Target Encoding Maps
        self.email_domain_map = {}
        self.card_country_map = {}
        self.global_fraud_rate = 0.0
        
        # One-Hot Encoding Categories
        self.card_brands = ["visa", "mastercard", "american express", "discover"]
        self.device_types = ["desktop", "mobile", "tablet"]
        
        # Expected Final Features (in strict alphabetical or fixed order)
        self.feature_columns = [
            "amount",
            "hour_of_day",
            "day_of_week",
            "ip_card_country_match",
            "email_domain_te",
            "card_country_te",
            "brand_visa",
            "brand_mastercard",
            "brand_amex",
            "brand_discover",
            "brand_other",
            "device_desktop",
            "device_mobile",
            "device_tablet",
            "device_other"
        ]

    def _extract_datetime_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts hour_of_day and day_of_week from created_at timestamp.
        """
        # Parse dates safely
        parsed_dates = pd.to_datetime(df["created_at"], errors="coerce")
        # Handle completely missing/null dates by defaulting to current time
        parsed_dates = parsed_dates.fillna(datetime.utcnow())
        
        df = df.copy()
        df["hour_of_day"] = parsed_dates.dt.hour
        df["day_of_week"] = parsed_dates.dt.dayofweek
        return df

    def _compute_country_match(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Creates a binary feature indicator representing if billing_country matches card_country.
        """
        df = df.copy()
        # Mismatch = 0, Match = 1. Handle case variations and empty values.
        bill_c = df["billing_country"].astype(str).str.strip().str.upper()
        card_c = df["card_country"].astype(str).str.strip().str.upper()
        df["ip_card_country_match"] = (bill_c == card_c).astype(int)
        return df

    def fit(self, df: pd.DataFrame, target_col: str = config.TARGET_COL):
        """
        Fits all preprocessors, mapping target encoders and caching global means.
        """
        df = df.copy()
        
        # Target labels
        y = df[target_col].values
        self.global_fraud_rate = float(np.mean(y))
        
        # 1. Fit target encoding for P_emaildomain (email_domain)
        self.email_domain_map = self._fit_smoothed_target_encoding(
            df, "email_domain", target_col
        )
        
        # 2. Fit target encoding for card_country
        self.card_country_map = self._fit_smoothed_target_encoding(
            df, "card_country", target_col
        )
        
        return self

    def _fit_smoothed_target_encoding(self, df: pd.DataFrame, col: str, target_col: str) -> dict:
        """
        Calculates smoothed target encoding weights to prevent overfitting on low count values.
        Formula: S_i = (count_i * mean_i + smoothing * global_mean) / (count_i + smoothing)
        """
        stats = df.groupby(col)[target_col].agg(["count", "mean"])
        
        te_map = {}
        for category, row in stats.iterrows():
            n = row["count"]
            mean_y = row["mean"]
            # Apply smoothing
            smoothed_val = (n * mean_y + config.TARGET_ENCODE_SMOOTHING * self.global_fraud_rate) / (n + config.TARGET_ENCODE_SMOOTHING)
            te_map[str(category).lower().strip()] = float(smoothed_val)
            
        return te_map

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms input transaction attributes into a pure numeric feature matrix.
        """
        df = df.copy()
        
        # 1. Parse datetime features
        df = self._extract_datetime_features(df)
        
        # 2. Calculate country mismatches
        df = self._compute_country_match(df)
        
        # 3. Apply target encoding maps (fallback to global fraud rate for new categories)
        email_clean = df["email_domain"].astype(str).str.lower().str.strip()
        df["email_domain_te"] = email_clean.map(self.email_domain_map).fillna(self.global_fraud_rate)
        
        card_country_clean = df["card_country"].astype(str).str.lower().str.strip()
        df["card_country_te"] = card_country_clean.map(self.card_country_map).fillna(self.global_fraud_rate)
        
        # 4. Handle one-hot encoding for card_brand
        brand_clean = df["card_brand"].astype(str).str.lower().str.strip()
        df["brand_visa"] = (brand_clean == "visa").astype(int)
        df["brand_mastercard"] = (brand_clean == "mastercard").astype(int)
        df["brand_amex"] = (brand_clean.isin(["american express", "amex"])).astype(int)
        df["brand_discover"] = (brand_clean == "discover").astype(int)
        
        # 'other' captures brand nulls or anything that isn't the primary 4
        df["brand_other"] = (~brand_clean.isin(["visa", "mastercard", "american express", "amex", "discover"])).astype(int)
        
        # 5. Handle one-hot encoding for device_type
        device_clean = df["device_type"].astype(str).str.lower().str.strip()
        df["device_desktop"] = (device_clean == "desktop").astype(int)
        df["device_mobile"] = (device_clean == "mobile").astype(int)
        df["device_tablet"] = (device_clean == "tablet").astype(int)
        df["device_other"] = (~device_clean.isin(["desktop", "mobile", "tablet"])).astype(int)
        
        # Ensure numerical outputs and extract only configured columns
        df["amount"] = df["amount"].fillna(0.0).astype(float)
        
        # Keep exact column order
        return df[self.feature_columns].copy()
