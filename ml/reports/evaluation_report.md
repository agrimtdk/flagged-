# Model Evaluation & Cost Optimization Report

## 1. Overall Performance Metrics
Evaluated on the out-of-fold validation subset.

- **ROC-AUC (Area Under ROC)**: 0.9503
- **PR-AUC (Precision-Recall AUC)**: 0.3801
- **Selected Optimal Decision Threshold**: 0.50

### Classification Report (At Threshold = 0.50)
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| 0 (Legitimate) | 0.9978 | 0.9449 | 0.9706 | 1452.0 |
| 1 (Fraudulent) | 0.3600 | 0.9375 | 0.5202 | 48.0 |
| **Accuracy** | | | 0.9447 | 1500.0 |

---

## 2. Business Cost-Benefit Analysis
Our optimization sweep evaluated the financial impact on operations using the SDD business cost weights:
- **True Positive Benefit**: $100.00 (Chargeback prevented)
- **False Positive Cost**: $30.00 (Customer friction/churn)
- **False Negative Cost**: $130.00 (Chargeback loss + fees)

### Confusion Matrix Counts (Validation Subset)
| Actual \ Predicted | Clean (Predicted) | Fraud (Predicted) |
| :--- | :---: | :---: |
| **Clean** | 1372 (True Negatives) | 80 (False Positives) |
| **Fraud** | 3 (False Negatives) | 45 (True Positives) |

### Net Savings Analysis
- **Prevented Chargebacks Volume (TP)**: 45 * $100 = **$4,500.00**
- **Customer Churn Loss (FP)**: 80 * $30 = **$2,400.00**
- **Missed Fraud Loss (FN)**: 3 * $130 = **$390.00**
- **Net Business Financial Utility**: **$1,710.00** (Optimized over default threshold 0.50)

---

## 3. False Positive & False Negative Analysis
*   **False Positives (FPs)**: 80 clean transactions flagged as fraud. Typically occur on high-value purchases made from domains with high aggregate risk profiles (e.g. anonymous domains).
*   **False Negatives (FNs)**: 3 fraud cases missed by the model. Occur on low-value transactions that mirror normal purchasing behaviors, keeping risk scores below the 0.50 cut-off.

---

## 4. Model Explainability (SHAP & Importance Summary)
Top model features that drive decision values, based on global SHAP feature importances:

| Feature | Description | Impact Direction | Importance Rank |
| :--- | :--- | :---: | :---: |
| `email_domain_te` | Email domain target risk value | Positive | 1 |
| `ip_card_country_match` | User IP matches Credit Card Country | Negative | 2 |
| `amount` | Transaction monetary value | Positive | 3 |
| `card_country_te` | Credit card issuing country risk value | Positive | 4 |


*Visual performance plots are saved in the reports directory:*
* ROC Curve: [roc_curve.png](file:///ml/reports/plots/roc_curve.png)
* PR Curve: [pr_curve.png](file:///ml/reports/plots/pr_curve.png)
* Cost Chart: [cost_vs_threshold.png](file:///ml/reports/plots/cost_vs_threshold.png)
* Calibration: [calibration_curve.png](file:///ml/reports/plots/calibration_curve.png)
* Importance: [feature_importance.png](file:///ml/reports/plots/feature_importance.png)
