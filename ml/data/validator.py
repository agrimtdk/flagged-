import os
import pandas as pd
from sklearn.model_selection import train_test_split
from ml.configs import config
from ml.data.make_dataset import load_raw_dataset


class DatasetValidator:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.clean_df = None
        self.stats = {}

    def validate_schema(self) -> bool:
        """
        Validates that all required columns are present in the dataset.
        """
        required_cols = [
            "transaction_external_id", "amount", "card_brand", 
            "billing_country", "ip_address", "device_type", 
            "email_domain", "card_country", "created_at", "is_fraud"
        ]
        missing_cols = [c for c in required_cols if c not in self.df.columns]
        
        self.stats["schema_valid"] = len(missing_cols) == 0
        self.stats["missing_columns"] = missing_cols
        return self.stats["schema_valid"]

    def analyze_missing_values(self):
        """
        Analyzes missing value counts and ratios.
        """
        missing_counts = self.df.isnull().sum()
        missing_ratios = self.df.isnull().mean()
        
        self.stats["missing"] = {
            col: {
                "count": int(count),
                "ratio": float(ratio)
            } for col, count, ratio in zip(self.df.columns, missing_counts, missing_ratios) if count > 0
        }

    def detect_duplicates(self) -> int:
        """
        Detects duplicate rows in the dataset based on ID or entire rows.
        """
        total_duplicates = int(self.df.duplicated(subset=["transaction_external_id"]).sum())
        self.stats["duplicate_count"] = total_duplicates
        return total_duplicates

    def clean_data(self) -> pd.DataFrame:
        """
        Cleans the dataset: removes duplicates, handles critical missing labels,
        and sets types.
        """
        # Remove duplicates
        df_cleaned = self.df.drop_duplicates(subset=["transaction_external_id"], keep="first").copy()
        
        # Verify target is not null
        df_cleaned = df_cleaned.dropna(subset=[config.TARGET_COL])
        
        # Enforce types
        df_cleaned["amount"] = df_cleaned["amount"].astype(float)
        df_cleaned[config.TARGET_COL] = df_cleaned[config.TARGET_COL].astype(int)
        
        self.clean_df = df_cleaned
        
        # Capture clean stats
        self.stats["total_records"] = len(self.df)
        self.stats["clean_records"] = len(df_cleaned)
        self.stats["fraud_count"] = int(df_cleaned[config.TARGET_COL].sum())
        self.stats["fraud_ratio"] = float(df_cleaned[config.TARGET_COL].mean())
        
        return df_cleaned

    def generate_data_quality_report(self):
        """
        Generates a comprehensive Markdown Data Quality Report.
        """
        os.makedirs(config.REPORTS_DIR, exist_ok=True)
        report_path = os.path.join(config.REPORTS_DIR, "data_quality_report.md")
        
        missing_rows = ""
        if self.stats.get("missing"):
            for col, item in self.stats["missing"].items():
                missing_rows += f"| {col} | {item['count']} | {item['ratio']*100:.2f}% |\n"
        else:
            missing_rows = "| None | 0 | 0.00% |\n"

        missing_cols_str = ", ".join(self.stats["missing_columns"]) if self.stats["missing_columns"] else "None"
        
        report_content = f"""# Data Quality Report

## Executive Summary
This report analyzes the raw transaction dataset loaded for the **flagged!** machine learning training pipeline.

- **Dataset Schema Validity**: {"VALID" if self.stats["schema_valid"] else "INVALID"} (Missing Columns: {missing_cols_str})
- **Total Input Rows**: {self.stats["total_records"]}
- **Cleaned Dataset Rows**: {self.stats["clean_records"]} (Duplicates Removed: {self.stats["duplicate_count"]})
- **Target Fraud Class Imbalance**: {self.stats["fraud_count"]} Fraud cases ({self.stats["fraud_ratio"] * 100:.2f}%)

---

## Missing Value Analysis
Below is the summary of columns containing null/missing entries in the raw dataset:

| Feature | Null Count | Missing Ratio |
| :--- | :---: | :---: |
{missing_rows}

*Note: Missing values in categorical variables like `device_type` and `card_brand` are natively handled by tree-based ensemble models (XGBoost/LightGBM).*

---

## Descriptive Statistics (Cleaned Features)
- **Amount Summary**:
  - Min: ${self.clean_df["amount"].min():.2f}
  - Max: ${self.clean_df["amount"].max():.2f}
  - Median: ${self.clean_df["amount"].median():.2f}
  - Mean: ${self.clean_df["amount"].mean():.2f}
"""
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report_content)
        print(f"Data Quality Report written to {report_path}.")


def perform_stratified_split(df: pd.DataFrame):
    """
    Splits the cleaned dataset into stratified Train (70%), Val (15%), and Test (15%) splits
    to prevent target fraud distribution leakage.
    """
    train_val_df, test_df = train_test_split(
        df,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_SEED,
        stratify=df[config.TARGET_COL]
    )
    
    # Calculate validation size ratio relative to training set to achieve exactly 15% overall split
    val_ratio = config.VAL_SIZE / (1.0 - config.TEST_SIZE)
    
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=val_ratio,
        random_state=config.RANDOM_SEED,
        stratify=train_val_df[config.TARGET_COL]
    )
    
    # Write splits to CSV files
    train_path = os.path.join(config.DATA_DIR, "train.csv")
    val_path = os.path.join(config.DATA_DIR, "val.csv")
    test_path = os.path.join(config.DATA_DIR, "test.csv")
    
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    print("Stratified splits generated successfully:")
    print(f"  - Train: {train_path} ({len(train_df)} rows, {train_df[config.TARGET_COL].mean()*100:.2f}% fraud)")
    print(f"  - Val:   {val_path} ({len(val_df)} rows, {val_df[config.TARGET_COL].mean()*100:.2f}% fraud)")
    print(f"  - Test:  {test_path} ({len(test_df)} rows, {test_df[config.TARGET_COL].mean()*100:.2f}% fraud)")


def run_data_validation():
    """
    Loads raw dataset, validates, cleans, split, and generates report.
    """
    raw_df = load_raw_dataset()
    validator = DatasetValidator(raw_df)
    
    if not validator.validate_schema():
        raise ValueError("Dataset schema validation failed. Required columns are missing.")
        
    validator.analyze_missing_values()
    validator.detect_duplicates()
    clean_df = validator.clean_data()
    
    validator.generate_data_quality_report()
    perform_stratified_split(clean_df)


if __name__ == "__main__":
    run_data_validation()
