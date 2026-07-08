import os

# Central Configuration for flagged! Machine Learning Platform
RANDOM_SEED = 42

# Data Splitting Parameters
TEST_SIZE = 0.2
VAL_SIZE = 0.15  # Proportion of training set to use for validation (stratified)

# Target Variable Label
TARGET_COL = "is_fraud"

# Dataset Storage Paths
DATA_DIR = "ml/datasets"
RAW_DATA_PATH = os.path.join(DATA_DIR, "raw_transactions.csv")
PROCESSED_DATA_PATH = os.path.join(DATA_DIR, "processed_transactions.csv")

# Versioning & Registry
MODEL_VERSION = "v1.0.0"
ARTIFACT_DIR = "ml/artifacts"
REPORTS_DIR = "ml/reports"
EXPERIMENTS_DIR = "ml/experiments"
EXPERIMENT_FILE = os.path.join(EXPERIMENTS_DIR, "experiment_log.csv")

# Business Cost Utility Matrix Parameters (from SDD Section 40)
BUSINESS_COST_MATRIX = {
    "benefit_tp": 100.0,  # Prevented chargeback amount
    "cost_fp": 30.0,      # Customer friction cost (LTV loss)
    "cost_fn": 130.0      # Chargeback cost + merchant fees
}

# Preprocessing Constants
TARGET_ENCODE_SMOOTHING = 10.0

# Hyperparameter Search Spaces for Tuning
TUNING_GRIDS = {
    "xgboost": {
        "max_depth": [3, 5, 7],
        "learning_rate": [0.01, 0.05, 0.1],
        "n_estimators": [100, 200, 300],
        "subsample": [0.8, 1.0],
        "colsample_bytree": [0.8, 1.0]
    },
    "lightgbm": {
        "max_depth": [3, 5, 7],
        "learning_rate": [0.01, 0.05, 0.1],
        "n_estimators": [100, 200],
        "num_leaves": [15, 31, 63]
    },
    "catboost": {
        "depth": [4, 6, 8],
        "learning_rate": [0.01, 0.05, 0.1],
        "iterations": [100, 200]
    },
    "random_forest": {
        "max_depth": [5, 10, 15],
        "n_estimators": [50, 100, 150],
        "min_samples_split": [2, 5]
    }
}
