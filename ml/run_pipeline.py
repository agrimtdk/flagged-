import argparse
import sys
from ml.data.validator import run_data_validation
from ml.training.train import run_training_pipeline
from ml.inference.predictor import FraudPredictor


def main():
    parser = argparse.ArgumentParser(description="flagged! ML Platform Orchestrator CLI")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only run dataset generation, validation, cleaning, and splitting."
    )
    parser.add_argument(
        "--train-only",
        action="store_true",
        help="Only run model training, benchmarking, cost tuning, and artifact serialization."
    )
    
    args = parser.parse_args()
    
    try:
        if args.validate_only:
            print("Running Data Validation Pipeline...")
            run_data_validation()
            print("Data Validation Completed Successfully.")
            
        elif args.train_only:
            print("Running Model Training Pipeline...")
            run_training_pipeline()
            print("Model Training Completed Successfully.")
            
        else:
            print("==================================================")
            print("Running Complete flagging! ML Pipeline (End-to-End)")
            print("==================================================")
            
            # Step 1: Clean & split data
            run_data_validation()
            
            # Step 2: Train, tune, evaluate & serialize
            run_training_pipeline()
            
            # Step 3: Verify inference works
            print("\nVerifying Inference Package...")
            predictor = FraudPredictor()
            
            mock_transaction = {
                "amount": 450.00,
                "card_brand": "VISA",
                "billing_country": "USA",
                "ip_address": "192.168.1.100",
                "device_type": "mobile",
                "email_domain": "anonymous.org",  # high risk domain
                "card_country": "CAN"              # country mismatch (USA vs CAN)
            }
            
            prediction = predictor.predict(mock_transaction)
            print(f"Mock Transaction Prediction: {prediction}")
            print("\n==================================================")
            print("Pipeline Run Completed Successfully!")
            print("==================================================")
            
    except Exception as e:
        print(f"\nPipeline Run FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
