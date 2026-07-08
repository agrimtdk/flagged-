# Model Benchmark & Selection Report

## Benchmarked Candidates
All models were evaluated on the stratified validation set. Imbalance is compensated using POS-weight ratios.

| Model | PR-AUC | Fit Duration | Latency (Per Row) |
| :--- | :---: | :---: | :---: |
| CatBoost | 0.3801 | 0.50s | 1.02ms |
| XGBoost | 0.3658 | 0.26s | 2.63ms |
| RandomForest | 0.3496 | 0.86s | 18.27ms |
| LightGBM | 0.3475 | 0.06s | 1.54ms |


---

## Selection Rationale
Following success metrics specified in **Section 6** of the Software Design Document:
1. **Primary Target Metric**: Area Under the Precision-Recall Curve (PR-AUC) must be maximized. **CatBoost** achieved the highest validation score of **0.3801**.
2. **Inference Constraints**: Sub-50ms latency is required. **CatBoost** processes single inference requests in **1.02ms**, well below the SLA limit.

Hence, **CatBoost** is selected as the production classifier.
