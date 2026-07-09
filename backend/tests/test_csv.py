import io
import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import UploadFile
from app.services.csv_service import CSVService
from app.exceptions import AppException


@pytest.mark.asyncio
async def test_csv_validation_success(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.1.0"
    mock_ml.threshold = 0.5
    mock_ml.predict.return_value = {
        "risk_score": 0.02,
        "is_fraud": False,
        "prediction_details": {"reasons": []}
    }

    # Setup valid CSV data
    csv_data = (
        "transaction_external_id,amount,card_brand,billing_country,ip_address,device_type,email_domain,card_country\n"
        "tx_csv_1,120.50,VISA,USA,127.0.0.1,desktop,gmail.com,USA\n"
        "tx_csv_2,15.00,MASTERCARD,CAN,10.0.0.1,mobile,yahoo.com,CAN\n"
    )

    upload_file = UploadFile(
        filename="test.csv",
        file=io.BytesIO(csv_data.encode("utf-8"))
    )

    org_id = uuid.uuid4()
    service = CSVService(db_session, mock_ml)
    
    # Mock predict_batch on PredictionService to avoid querying DB directly in unit tests
    service.prediction_service.predict_batch = AsyncMock(return_value=[
        MagicMock(is_fraud=False), MagicMock(is_fraud=False)
    ])

    res = await service.process_upload(org_id, upload_file)

    assert res.total_rows == 2
    assert res.processed_rows == 2
    assert res.failed_rows == 0
    assert len(res.validation_errors) == 0


@pytest.mark.asyncio
async def test_csv_validation_row_errors(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.1.0"
    mock_ml.threshold = 0.5
    
    # Setup CSV data with some row-level validation errors
    # Row 1: Valid
    # Row 2: Invalid card brand, invalid billing_country length
    csv_data = (
        "transaction_external_id,amount,card_brand,billing_country,ip_address,device_type,email_domain,card_country\n"
        "tx_csv_1,120.50,VISA,USA,127.0.0.1,desktop,gmail.com,USA\n"
        "tx_csv_2,-5.00,INVALID_BRAND,US,10.0.0.1,mobile,yahoo.com,CAN\n"
    )

    upload_file = UploadFile(
        filename="test.csv",
        file=io.BytesIO(csv_data.encode("utf-8"))
    )

    org_id = uuid.uuid4()
    service = CSVService(db_session, mock_ml)
    
    # Mock predict_batch
    service.prediction_service.predict_batch = AsyncMock(return_value=[MagicMock(is_fraud=False)])

    res = await service.process_upload(org_id, upload_file)

    assert res.total_rows == 2
    assert res.processed_rows == 1
    assert res.failed_rows == 1
    assert len(res.validation_errors) == 3 # amount negative, brand invalid, billing_country US (not 3 chars)
    assert res.validation_errors[0].row_number == 3


@pytest.mark.asyncio
async def test_csv_schema_duplicate_columns(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.1.0"
    mock_ml.threshold = 0.5
    csv_data = (
        "transaction_external_id,amount,card_brand,billing_country,ip_address,device_type,email_domain,card_country,amount\n"
        "tx_csv_1,120.50,VISA,USA,127.0.0.1,desktop,gmail.com,USA,120.50\n"
    )

    upload_file = UploadFile(
        filename="test.csv",
        file=io.BytesIO(csv_data.encode("utf-8"))
    )

    service = CSVService(db_session, mock_ml)
    with pytest.raises(AppException) as exc:
        await service.process_upload(uuid.uuid4(), upload_file)
    
    assert exc.value.code == "DUPLICATE_COLUMNS"


@pytest.mark.asyncio
async def test_csv_schema_unknown_columns(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.1.0"
    mock_ml.threshold = 0.5
    csv_data = (
        "transaction_external_id,amount,card_brand,billing_country,ip_address,device_type,email_domain,card_country,extra_col\n"
        "tx_csv_1,120.50,VISA,USA,127.0.0.1,desktop,gmail.com,USA,value\n"
    )

    upload_file = UploadFile(
        filename="test.csv",
        file=io.BytesIO(csv_data.encode("utf-8"))
    )

    service = CSVService(db_session, mock_ml)
    with pytest.raises(AppException) as exc:
        await service.process_upload(uuid.uuid4(), upload_file)
    
    assert exc.value.code == "UNKNOWN_COLUMNS"


@pytest.mark.asyncio
async def test_csv_invalid_format_extension(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.1.0"
    upload_file = UploadFile(
        filename="test.txt",
        file=io.BytesIO(b"data")
    )
    service = CSVService(db_session, mock_ml)
    with pytest.raises(AppException) as exc:
        await service.process_upload(uuid.uuid4(), upload_file)
    assert exc.value.code == "INVALID_FILE_FORMAT"
