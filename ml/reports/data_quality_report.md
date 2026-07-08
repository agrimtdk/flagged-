# Data Quality Report

## Executive Summary
This report analyzes the raw transaction dataset loaded for the **flagged!** machine learning training pipeline.

- **Dataset Schema Validity**: VALID (Missing Columns: None)
- **Total Input Rows**: 10010
- **Cleaned Dataset Rows**: 10000 (Duplicates Removed: 10)
- **Target Fraud Class Imbalance**: 322 Fraud cases (3.22%)

---

## Missing Value Analysis
Below is the summary of columns containing null/missing entries in the raw dataset:

| Feature | Null Count | Missing Ratio |
| :--- | :---: | :---: |
| card_brand | 185 | 1.85% |
| device_type | 200 | 2.00% |


*Note: Missing values in categorical variables like `device_type` and `card_brand` are natively handled by tree-based ensemble models (XGBoost/LightGBM).*

---

## Descriptive Statistics (Cleaned Features)
- **Amount Summary**:
  - Min: $1.51
  - Max: $2268.06
  - Median: $44.78
  - Mean: $73.69
