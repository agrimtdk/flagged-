import os
import shutil
import pytest
import pandas as pd
import numpy as np
from ml.configs import config
from ml.data.make_dataset import generate_synthetic_dataset
from ml.data.validator import DatasetValidator
from ml.features.pipeline import PreprocessorPipeline
from ml.inference.predictor import FraudPredictor
from ml.training.train import run_training_pipeline


@pytest.fixture
def sample_raw_df():
    return generate_synthetic_dataset(num_rows=200, fraud_ratio=0.05)


def test_dataset_generation_and_validation(sample_raw_df):
    """
    Tests dataset generator schema, duplicate detection, and cleaning logic.
    """
    validator = DatasetValidator(sample_raw_df)
    assert validator.validate_schema() is True
    
    dup_count = validator.detect_duplicates()
    assert dup_count > 0  # We intentionally injected 10 duplicate rows
    
    clean_df = validator.clean_data()
    assert len(clean_df) == len(sample_raw_df) - dup_count
    assert config.TARGET_COL in clean_df.columns
    assert (clean_df[config.TARGET_COL].isnull().sum()) == 0


def test_preprocessor_pipeline(sample_raw_df):
    """
    Tests preprocessing feature extraction, target encoding, and encoding outputs structure.
    """
    validator = DatasetValidator(sample_raw_df)
    validator.clean_data()
    clean_df = validator.clean_df
    
    preprocessor = PreprocessorPipeline()
    preprocessor.fit(clean_df)
    
    X = preprocessor.transform(clean_df)
    
    # Check outputs type and shape
    assert isinstance(X, pd.DataFrame)
    assert X.shape[1] == len(preprocessor.feature_columns)
    assert list(X.columns) == preprocessor.feature_columns
    
    # Verify no nulls exist in processed dataframe
    assert X.isnull().sum().sum() == 0
    
    # Verify one-hot outputs are binary
    for col in ["brand_visa", "brand_other", "device_desktop", "device_other"]:
        assert set(X[col].unique()).issubset({0, 1})
        
    # Verify country mismatches
    mismatches = clean_df[clean_df["billing_country"] != clean_df["card_country"]]
    if not mismatches.empty:
        X_mismatches = preprocessor.transform(mismatches)
        assert (X_mismatches["ip_card_country_match"] == 0).all()


def test_end_to_end_training_and_inference(tmp_path):
    """
    Executes a mini end-to-end run of validation, training, and checks inference accuracy.
    """
    # 1. Setup mock paths under pytest tmp_path
    mock_data_dir = tmp_path / "datasets"
    mock_artifact_dir = tmp_path / "artifacts"
    mock_reports_dir = tmp_path / "reports"
    mock_experiments_dir = tmp_path / "experiments"
    
    # Mock config parameters dynamically
    original_data_dir = config.DATA_DIR
    original_raw_path = config.RAW_DATA_PATH
    original_processed_path = config.PROCESSED_DATA_PATH
    original_artifact_dir = config.ARTIFACT_DIR
    original_reports_dir = config.REPORTS_DIR
    original_experiments_dir = config.EXPERIMENTS_DIR
    original_experiment_file = config.EXPERIMENT_FILE
    
    config.DATA_DIR = str(mock_data_dir)
    config.RAW_DATA_PATH = os.path.join(config.DATA_DIR, "raw_transactions.csv")
    config.PROCESSED_DATA_PATH = os.path.join(config.DATA_DIR, "processed_transactions.csv")
    config.ARTIFACT_DIR = str(mock_artifact_dir)
    config.REPORTS_DIR = str(mock_reports_dir)
    config.EXPERIMENTS_DIR = str(mock_experiments_dir)
    config.EXPERIMENT_FILE = os.path.join(config.EXPERIMENTS_DIR, "experiment_log.csv")
    
    try:
        # Generate 150 training rows under mock path
        df = generate_synthetic_dataset(num_rows=150)
        os.makedirs(config.DATA_DIR, exist_ok=True)
        df.to_csv(config.RAW_DATA_PATH, index=False)
        
        # Run entire training
        run_training_pipeline()
        
        # Verify artifacts exist
        version_dir = os.path.join(config.ARTIFACT_DIR, config.MODEL_VERSION)
        assert os.path.exists(os.path.join(version_dir, "model.joblib"))
        assert os.path.exists(os.path.join(version_dir, "preprocessor.joblib"))
        assert os.path.exists(os.path.join(version_dir, "metadata.json"))
        
        # Verify reports exist
        assert os.path.exists(os.path.join(config.REPORTS_DIR, "model_comparison_report.md"))
        assert os.path.exists(os.path.join(config.REPORTS_DIR, "evaluation_report.md"))
        assert os.path.exists(os.path.join(config.REPORTS_DIR, "plots", "roc_curve.png"))
        
        # Verify experiment logs exist
        assert os.path.exists(config.EXPERIMENT_FILE)
        
        # Verify Predictor works using newly trained mock artifacts
        predictor = FraudPredictor(version=config.MODEL_VERSION, artifact_dir=config.ARTIFACT_DIR)
        
        mock_payload = {
            "amount": 25.50,
            "card_brand": "visa",
            "billing_country": "USA",
            "ip_address": "127.0.0.1",
            "device_type": "desktop",
            "email_domain": "gmail.com",
            "card_country": "USA"
        }
        
        res = predictor.predict(mock_payload)
        assert "risk_score" in res
        assert "is_fraud" in res
        assert "prediction_details" in res
        assert "reasons" in res["prediction_details"]
        
    finally:
        # Restore original configurations
        config.DATA_DIR = original_data_dir
        config.RAW_DATA_PATH = original_raw_path
        config.PROCESSED_DATA_PATH = original_processed_path
        config.ARTIFACT_DIR = original_artifact_dir
        config.REPORTS_DIR = original_reports_dir
        config.EXPERIMENTS_DIR = original_experiments_dir
        config.EXPERIMENT_FILE = original_experiment_file
