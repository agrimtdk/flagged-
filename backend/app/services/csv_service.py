import io
import uuid
import logging
import pandas as pd
from typing import List, Tuple
from fastapi import UploadFile

from app.core.config import settings
from app.core.ml_engine import MLEngine
from app.exceptions import AppException
from app.services.prediction_service import PredictionService
from app.schemas.predict import CSVRowError, CSVUploadResponse

logger = logging.getLogger("app.services.csv")


class CSVService:
    """
    Streaming CSV parser with row-level validation.
    - Rejects duplicate column names
    - Rejects unknown columns
    - Enforces 10MB and 50,000 row limits
    - Synchronous parsing via FastAPI background threads, chunk-based streaming
    - Collects validation errors at row level and continues processing valid rows
    """

    REQUIRED_COLUMNS = {
        "transaction_external_id",
        "amount",
        "card_brand",
        "billing_country",
        "ip_address",
        "device_type",
        "email_domain",
        "card_country"
    }

    ALLOWED_BRANDS = {"VISA", "MASTERCARD", "AMEX", "DISCOVER", "OTHER"}
    ALLOWED_DEVICES = {"desktop", "mobile", "tablet", "other"}

    def __init__(self, db, ml_engine: MLEngine):
        self.db = db
        self.ml_engine = ml_engine
        self.prediction_service = PredictionService(db, ml_engine)

    async def process_upload(self, org_id: uuid.UUID, file: UploadFile, created_by: str = "CSV Upload") -> CSVUploadResponse:
        import time
        from app.services.dataset_service import DatasetService
        start_time = time.perf_counter()
        dataset_service = DatasetService(self.db)

        # 1. Enforce size limits (10MB)
        content = await file.read(settings.CSV_MAX_SIZE_BYTES + 1)
        if len(content) > settings.CSV_MAX_SIZE_BYTES:
            raise AppException(
                status_code=413,
                code="PAYLOAD_TOO_LARGE",
                message=f"CSV file exceeds maximum allowed size of {settings.CSV_MAX_SIZE_BYTES // (1024*1024)}MB."
            )
        
        if not content:
            raise AppException(
                status_code=400,
                code="EMPTY_FILE",
                message="Uploaded CSV file is empty."
            )

        # 2. Check duplicate / unknown columns on raw header
        file_stream = io.StringIO(content.decode("utf-8-sig", errors="ignore"))
        header_line = file_stream.readline()
        if not header_line:
            raise AppException(
                status_code=400,
                code="INVALID_CSV",
                message="CSV file lacks a header row."
            )

        columns = [c.strip().lstrip("\ufeff") for c in header_line.split(",")]
        
        seen_cols = set()
        duplicates = []
        for col in columns:
            if col in seen_cols:
                duplicates.append(col)
            seen_cols.add(col)
        
        if duplicates:
            raise AppException(
                status_code=400,
                code="DUPLICATE_COLUMNS",
                message=f"CSV contains duplicate column names: {', '.join(duplicates)}"
            )

        col_set = set(columns)
        missing_cols = self.REQUIRED_COLUMNS - col_set
        if missing_cols:
            raise AppException(
                status_code=400,
                code="MISSING_COLUMNS",
                message=f"CSV is missing required columns: {', '.join(missing_cols)}. Required: {', '.join(sorted(self.REQUIRED_COLUMNS))}"
            )

        unknown_cols = col_set - self.REQUIRED_COLUMNS
        if unknown_cols:
            raise AppException(
                status_code=400,
                code="UNKNOWN_COLUMNS",
                message=f"CSV contains unknown columns: {', '.join(unknown_cols)}. Only standard columns are permitted."
            )

        file_stream.seek(0)
        
        batch_id = uuid.uuid4()
        valid_transactions = []
        validation_errors = []
        total_rows = 0

        # Create Collection in "Processing" state
        dataset = await dataset_service.create_collection(
            org_id=org_id,
            name=file.filename or "uploaded_transactions.csv",
            source="CSV",
            created_by=created_by,
            original_filename=file.filename,
            file_size_bytes=len(content),
            model_version=self.ml_engine.version,
            threshold_version=str(self.ml_engine.threshold),
            feature_schema_version="v1.0.0",
            status_str="Processing",
            dataset_id=batch_id,
        )

        try:
            chunk_iterator = pd.read_csv(
                file_stream,
                chunksize=1000,
                keep_default_na=False,
                dtype=str
            )
            
            for chunk in chunk_iterator:
                for idx, row in chunk.iterrows():
                    line_number = int(idx) + 2
                    total_rows += 1
                    
                    if total_rows > settings.CSV_MAX_ROWS:
                        raise AppException(
                            status_code=400,
                            code="CSV_EXCEEDS_ROW_LIMIT",
                            message=f"CSV file exceeds maximum row limit of {settings.CSV_MAX_ROWS}."
                        )
                    
                    row_dict = row.to_dict()
                    errors = self._validate_row(row_dict, line_number)
                    
                    if errors:
                        validation_errors.extend(errors)
                    else:
                        amount_val = float(row_dict["amount"])
                        valid_transactions.append({
                            "transaction_external_id": row_dict["transaction_external_id"].strip(),
                            "amount": amount_val,
                            "card_brand": row_dict["card_brand"].upper().strip(),
                            "billing_country": row_dict["billing_country"].upper().strip(),
                            "ip_address": row_dict["ip_address"].strip(),
                            "device_type": row_dict["device_type"].lower().strip(),
                            "email_domain": row_dict["email_domain"].lower().strip(),
                            "card_country": row_dict["card_country"].upper().strip(),
                        })

        except AppException as e:
            dataset.status = "Failed"
            dataset_service.repo.update(dataset)
            await dataset_service.repo.flush()
            raise e
        except Exception as e:
            dataset.status = "Failed"
            dataset_service.repo.update(dataset)
            await dataset_service.repo.flush()
            logger.error(f"Error parsing CSV file chunk: {e}")
            raise AppException(
                status_code=400,
                code="INVALID_CSV_FORMAT",
                message=f"Failed to parse CSV file: {e}"
            )

        fraud_detected = 0
        processed_rows = len(valid_transactions)

        if processed_rows > 0:
            try:
                scored_transactions = await self.prediction_service.predict_batch(
                    org_id=org_id,
                    transactions_data=valid_transactions,
                    batch_id=batch_id,
                    source="CSV"
                )
                
                fraud_detected = sum(1 for tx in scored_transactions if tx.is_fraud)
                
            except Exception as e:
                dataset.status = "Failed"
                dataset_service.repo.update(dataset)
                await dataset_service.repo.flush()
                logger.error(f"Failed to run predictions for batch: {e}")
                raise AppException(
                    status_code=500,
                    code="BATCH_PREDICTION_FAILED",
                    message=f"Internal error executing batch prediction: {e}"
                )

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        avg_risk = sum(tx.risk_score for tx in scored_transactions) / processed_rows if processed_rows > 0 else 0.0
        
        dataset.total_rows = processed_rows
        dataset.fraud_count = fraud_detected
        dataset.avg_risk_score = round(avg_risk, 4)
        dataset.processing_duration_ms = round(duration_ms, 2)
        dataset.status = "Completed"
        dataset_service.repo.update(dataset)
        await dataset_service.repo.flush()

        return CSVUploadResponse(
            batch_id=batch_id,
            total_rows=total_rows,
            processed_rows=processed_rows,
            failed_rows=len(set(e.row_number for e in validation_errors)),
            fraud_detected=fraud_detected,
            validation_errors=validation_errors
        )

    def _validate_row(self, row: dict, row_num: int) -> List[CSVRowError]:
        errors = []

        # transaction_external_id
        ext_id = row.get("transaction_external_id", "").strip()
        if not ext_id:
            errors.append(CSVRowError(row_number=row_num, field="transaction_external_id", error="Value cannot be empty."))

        # amount
        amount_raw = row.get("amount", "").strip()
        try:
            amount = float(amount_raw)
            if amount <= 0:
                errors.append(CSVRowError(row_number=row_num, field="amount", error="Amount must be positive and greater than 0."))
        except ValueError:
            errors.append(CSVRowError(row_number=row_num, field="amount", error=f"Invalid numeric amount: '{amount_raw}'"))

        # card_brand
        brand = row.get("card_brand", "").upper().strip()
        if brand not in self.ALLOWED_BRANDS:
            errors.append(CSVRowError(row_number=row_num, field="card_brand", error=f"Brand must be one of {self.ALLOWED_BRANDS}."))

        # billing_country
        b_country = row.get("billing_country", "").strip()
        if len(b_country) != 3:
            errors.append(CSVRowError(row_number=row_num, field="billing_country", error="Billing country must be a 3-character ISO code."))

        # ip_address
        ip = row.get("ip_address", "").strip()
        if not ip:
            errors.append(CSVRowError(row_number=row_num, field="ip_address", error="IP address cannot be empty."))

        # device_type
        device = row.get("device_type", "").lower().strip()
        if device not in self.ALLOWED_DEVICES:
            errors.append(CSVRowError(row_number=row_num, field="device_type", error=f"Device type must be one of {self.ALLOWED_DEVICES}."))

        # email_domain
        email = row.get("email_domain", "").strip()
        if not email:
            errors.append(CSVRowError(row_number=row_num, field="email_domain", error="Email domain cannot be empty."))

        # card_country
        c_country = row.get("card_country", "").strip()
        if len(c_country) != 3:
            errors.append(CSVRowError(row_number=row_num, field="card_country", error="Card country must be a 3-character ISO code."))

        return errors
