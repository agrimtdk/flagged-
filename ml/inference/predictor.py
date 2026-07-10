import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone


class FraudPredictor:
    def __init__(self, version: str = "v1.0.0", artifact_dir: str = "ml/artifacts"):
        self.version = version
        self.version_path = os.path.join(artifact_dir, version)
        
        # Load persisted artifacts
        metadata_path = os.path.join(self.version_path, "metadata.json")
        preprocessor_path = os.path.join(self.version_path, "preprocessor.joblib")
        model_path = os.path.join(self.version_path, "model.joblib")
        
        if not (os.path.exists(metadata_path) and os.path.exists(preprocessor_path) and os.path.exists(model_path)):
            raise FileNotFoundError(
                f"Production artifacts for version '{version}' were not found in {self.version_path}. "
                "Ensure training pipeline has completed successfully."
            )
            
        with open(metadata_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
            
        self.optimal_threshold = self.metadata["optimal_threshold"]
        self.feature_columns = self.metadata["features"]
        self.preprocessor = joblib.load(preprocessor_path)
        self.model = joblib.load(model_path)
        
        # Extract feature importances to calculate custom explanations at runtime
        self.feature_importances = {}
        if hasattr(self.model, "feature_importances_"):
            self.feature_importances = dict(zip(self.feature_columns, self.model.feature_importances_))
        else:
            # Fallback uniform importances if model doesn't have it
            self.feature_importances = {col: 1.0 / len(self.feature_columns) for col in self.feature_columns}

    def validate_inputs(self, transaction: dict):
        """
        Validates that required features are present in the transaction payload.
        """
        required_keys = [
            "amount", "card_brand", "billing_country", 
            "ip_address", "device_type", "email_domain", "card_country"
        ]
        missing_keys = [k for k in required_keys if k not in transaction]
        if missing_keys:
            raise ValueError(f"Missing required transaction keys: {', '.join(missing_keys)}")

    def predict(self, transaction: dict, threshold: float = None) -> dict:
        """
        Preprocesses raw transaction payload, executes prediction score, 
        applies threshold, and returns structured decision object with explanations.
        """
        self.validate_inputs(transaction)
        
        # Safe copy
        tx = transaction.copy()
        
        # Default created_at if missing
        if "created_at" not in tx or not tx["created_at"]:
            tx["created_at"] = datetime.now(timezone.utc).isoformat()
            
        # Convert dictionary to single-row DataFrame
        df_raw = pd.DataFrame([tx])
        
        # Transform features
        X = self.preprocessor.transform(df_raw)
        
        # Compute prediction probability
        prob = float(self.model.predict_proba(X)[0, 1])
        active_thresh = threshold if threshold is not None else self.optimal_threshold
        is_fraud = prob >= active_thresh
        
        # Compute prediction explanation reasons
        # We calculate impact by multiplying the scaled feature values by their model importance weight
        reasons = []
        for col in self.feature_columns:
            val = float(X.loc[0, col])
            importance = self.feature_importances.get(col, 0.0)
            
            # Look for positive drivers of fraud
            if val > 0 and importance > 0:
                # Custom descriptive feature names for reasons
                feature_name = col
                if col == "ip_card_country_match" and val == 0:
                    # Country mismatch is a strong indicator of fraud
                    feature_name = "ip_card_country_mismatch"
                    reasons.append({
                        "feature": feature_name,
                        "impact": round(importance * 1.5, 3) # Elevate visibility of mismatch
                    })
                elif col == "email_domain_te" and val > self.preprocessor.global_fraud_rate:
                    feature_name = "high_risk_email_domain"
                    reasons.append({
                        "feature": feature_name,
                        "impact": round(importance * val, 3)
                    })
                elif col == "card_country_te" and val > self.preprocessor.global_fraud_rate:
                    feature_name = "high_risk_card_country"
                    reasons.append({
                        "feature": feature_name,
                        "impact": round(importance * val, 3)
                    })
                elif col == "amount" and val > 500.0:
                    feature_name = "high_transaction_amount"
                    reasons.append({
                        "feature": feature_name,
                        "impact": round(importance * (val / 500.0), 3)
                    })
                    
        # Sort reasons by descending impact and cap at top 3
        reasons = sorted(reasons, key=lambda x: x["impact"], reverse=True)[:3]
        
        # Default fallback reason if list is empty
        if not reasons:
            reasons.append({
                "feature": "base_rate_probability",
                "impact": round(prob, 3)
            })
            
        return {
            "risk_score": round(prob, 4),
            "is_fraud": bool(is_fraud),
            "prediction_details": {
                "reasons": reasons
            }
        }

    def predict_batch(self, transactions: list[dict], threshold: float = None) -> list[dict]:
        """
        Vectorized batch prediction for a list of transaction dictionaries.
        Preprocesses all transaction payloads in a single DataFrame, executes CatBoost prediction,
        applies active threshold, and returns structured decision objects with explanations.
        """
        if not transactions:
            return []

        tx_list = []
        now_iso = datetime.now(timezone.utc).isoformat()
        for tx in transactions:
            self.validate_inputs(tx)
            row = tx.copy()
            if "created_at" not in row or not row["created_at"]:
                row["created_at"] = now_iso
            tx_list.append(row)

        df_raw = pd.DataFrame(tx_list)

        # Vectorized transform on entire batch
        X = self.preprocessor.transform(df_raw)

        # Vectorized probability calculation on entire batch
        probs = self.model.predict_proba(X)[:, 1]

        X_records = X.to_dict('records')
        results = []
        global_fraud_rate = getattr(self.preprocessor, 'global_fraud_rate', 0.05)
        active_thresh = threshold if threshold is not None else self.optimal_threshold

        for i, prob_val in enumerate(probs):
            prob = float(prob_val)
            is_fraud = prob >= active_thresh
            row_dict = X_records[i]

            reasons = []
            for col in self.feature_columns:
                val = float(row_dict.get(col, 0.0))
                importance = self.feature_importances.get(col, 0.0)
                if val > 0 and importance > 0:
                    feature_name = col
                    if col == "ip_card_country_match" and val == 0:
                        feature_name = "ip_card_country_mismatch"
                        reasons.append({
                            "feature": feature_name,
                            "impact": round(importance * 1.5, 3)
                        })
                    elif col == "email_domain_te" and val > global_fraud_rate:
                        feature_name = "high_risk_email_domain"
                        reasons.append({
                            "feature": feature_name,
                            "impact": round(importance * val, 3)
                        })
                    elif col == "card_country_te" and val > global_fraud_rate:
                        feature_name = "high_risk_card_country"
                        reasons.append({
                            "feature": feature_name,
                            "impact": round(importance * val, 3)
                        })
                    elif col == "amount" and val > 500.0:
                        feature_name = "high_transaction_amount"
                        reasons.append({
                            "feature": feature_name,
                            "impact": round(importance * (val / 500.0), 3)
                        })

            reasons = sorted(reasons, key=lambda x: x["impact"], reverse=True)[:3]
            if not reasons:
                reasons.append({
                    "feature": "base_rate_probability",
                    "impact": round(prob, 3)
                })

            results.append({
                "risk_score": round(prob, 4),
                "is_fraud": bool(is_fraud),
                "prediction_details": {
                    "reasons": reasons
                }
            })

        return results

