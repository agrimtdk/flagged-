import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, Numeric, String, case, func, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.transaction import Transaction
from app.repositories.base import BaseRepository
from app.schemas.predict import TransactionFilters


class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self, db: AsyncSession):
        super().__init__(Transaction, db)

    async def get_by_prediction_id(self, prediction_id: uuid.UUID, org_id: uuid.UUID) -> Optional[Transaction]:
        """
        Retrieves transaction by prediction_id UUID and organization_id.
        """
        result = await self.db.execute(
            select(Transaction).filter(
                Transaction.prediction_id == prediction_id,
                Transaction.organization_id == org_id
            )
        )
        return result.scalars().first()

    async def get_paginated(
        self, page: int, page_size: int, filters: TransactionFilters, org_id: uuid.UUID
    ) -> Tuple[List[Transaction], int]:
        """
        Dynamic WHERE clause builder from filters.
        Supports pagination, filtering, sorting, tenant isolation, and collection filtering.
        """
        query = select(Transaction)
        count_query = select(func.count(Transaction.id))

        # Enforce tenant isolation
        conditions = [Transaction.organization_id == org_id]

        if filters.dataset_id:
            conditions.append(Transaction.dataset_id == filters.dataset_id)
        if filters.source:
            conditions.append(Transaction.source == filters.source)
        if filters.is_fraud is not None:
            conditions.append(Transaction.is_fraud == filters.is_fraud)
        if filters.date_from:
            conditions.append(Transaction.created_at >= filters.date_from)
        if filters.date_to:
            conditions.append(Transaction.created_at <= filters.date_to)
        if filters.risk_score_min is not None:
            conditions.append(Transaction.risk_score >= filters.risk_score_min)
        if filters.risk_score_max is not None:
            conditions.append(Transaction.risk_score <= filters.risk_score_max)
        if filters.search:
            conditions.append(
                Transaction.transaction_external_id.ilike(f"%{filters.search}%")
            )

        if conditions:
            query = query.where(*conditions)
            count_query = count_query.where(*conditions)

        # Execute total count
        count_result = await self.db.execute(count_query)
        total_items = count_result.scalar() or 0

        # Apply sorting
        sort_attr = getattr(Transaction, filters.sort_by, Transaction.created_at)
        if filters.sort_order.lower() == "asc":
            query = query.order_by(sort_attr.asc())
        else:
            query = query.order_by(sort_attr.desc())

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total_items

    async def bulk_create(self, transactions: List[Transaction]) -> int:
        """
        Bulk inserts transactions using session.add_all.
        Does not commit; flush changes to check constraints.
        """
        if not transactions:
            return 0
        self.db.add_all(transactions)
        await self.db.flush()
        return len(transactions)

    async def get_analytics_summary_raw(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        """
        Retrieves aggregated transaction metrics in a single round trip, scoped by organization_id and optional dataset_id.
        """
        now = datetime.now(timezone.utc)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = start_of_today - timedelta(days=6)

        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            func.count(Transaction.id).label("total_transactions"),
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("total_fraud"),
            func.avg(Transaction.risk_score).label("avg_risk_score"),
            func.sum(case((Transaction.created_at >= start_of_today, 1), else_=0)).label("transactions_today"),
            func.sum(case((Transaction.created_at >= start_of_week, 1), else_=0)).label("transactions_this_week")
        ).where(*conditions)

        result = await self.db.execute(query)
        row = result.first()

        if not row or row[0] == 0:
            return {
                "total_transactions": 0,
                "total_fraud": 0,
                "fraud_rate": 0.0,
                "avg_risk_score": 0.0,
                "transactions_today": 0,
                "transactions_this_week": 0
            }

        total_tx = row.total_transactions or 0
        total_fr = row.total_fraud or 0
        avg_risk = float(row.avg_risk_score or 0.0)

        return {
            "total_transactions": total_tx,
            "total_fraud": total_fr,
            "fraud_rate": round(total_fr / total_tx, 4) if total_tx > 0 else 0.0,
            "avg_risk_score": round(avg_risk, 4),
            "transactions_today": int(row.transactions_today or 0),
            "transactions_this_week": int(row.transactions_this_week or 0)
        }

    async def get_top_billing_countries(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None, limit: int = 10) -> List[Dict[str, Any]]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.billing_country,
            func.count(Transaction.id).label("count"),
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud_count")
        ).where(*conditions).group_by(
            Transaction.billing_country
        ).order_by(
            func.count(Transaction.id).desc()
        ).limit(limit)

        result = await self.db.execute(query)
        return [
            {"country": row.billing_country, "count": row.count, "fraud_count": int(row.fraud_count or 0)}
            for row in result.all()
        ]

    async def get_top_card_brands(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.card_brand,
            func.count(Transaction.id).label("count"),
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud_count")
        ).where(*conditions).group_by(
            Transaction.card_brand
        ).order_by(
            func.count(Transaction.id).desc()
        )

        result = await self.db.execute(query)
        return [
            {"brand": row.card_brand, "count": row.count, "fraud_count": int(row.fraud_count or 0)}
            for row in result.all()
        ]

    async def get_device_distribution(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.device_type,
            func.count(Transaction.id).label("count")
        ).where(*conditions).group_by(
            Transaction.device_type
        ).order_by(
            func.count(Transaction.id).desc()
        )

        result = await self.db.execute(query)
        return [{"device_type": row.device_type, "count": row.count} for row in result.all()]

    async def get_fraud_by_device(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.device_type,
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud_count"),
            func.count(Transaction.id).label("total")
        ).where(*conditions).group_by(
            Transaction.device_type
        ).order_by(
            func.count(Transaction.id).desc()
        )

        result = await self.db.execute(query)
        return [
            {
                "device_type": row.device_type,
                "fraud_count": int(row.fraud_count or 0),
                "total": row.total
            }
            for row in result.all()
        ]

    async def get_fraud_by_country(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None, limit: int = 10) -> List[Dict[str, Any]]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.billing_country,
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud_count"),
            func.count(Transaction.id).label("total")
        ).where(*conditions).group_by(
            Transaction.billing_country
        ).order_by(
            func.sum(case((Transaction.is_fraud == True, 1), else_=0)).desc()
        ).limit(limit)

        result = await self.db.execute(query)
        return [
            {
                "country": row.billing_country,
                "fraud_count": int(row.fraud_count or 0),
                "total": row.total
            }
            for row in result.all()
        ]

    async def get_source_distribution(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None) -> Dict[str, int]:
        conditions = [Transaction.organization_id == org_id]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        query = select(
            Transaction.source,
            func.count(Transaction.id).label("count")
        ).where(*conditions).group_by(Transaction.source)

        result = await self.db.execute(query)
        dist = {"API": 0, "CSV": 0}
        for row in result.all():
            dist[row.source] = row.count
        return dist

    async def get_fraud_timeline(self, org_id: uuid.UUID, dataset_id: Optional[uuid.UUID] = None, days: int = 30) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days - 1)
        start_date_trunc = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

        conditions = [
            Transaction.organization_id == org_id,
            Transaction.created_at >= start_date_trunc
        ]
        if dataset_id:
            conditions.append(Transaction.dataset_id == dataset_id)

        is_api_mode = False
        if dataset_id:
            from app.models.dataset import Dataset
            dataset_obj = await self.db.get(Dataset, dataset_id)
            if dataset_obj and dataset_obj.source == "API":
                is_api_mode = True

        if is_api_mode:
            date_expr_min = func.to_char(Transaction.created_at, literal_column("'HH24:MI'"))
            query = select(
                date_expr_min.label("date"),
                func.count(Transaction.id).label("total"),
                func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud"),
                func.avg(Transaction.risk_score).label("avg_risk")
            ).where(*conditions).group_by(
                date_expr_min
            ).order_by(
                date_expr_min.asc()
            )
            result = await self.db.execute(query)
            rows = result.all()
            if len(rows) <= 1:
                date_expr_sec = func.to_char(Transaction.created_at, literal_column("'HH24:MI:SS'"))
                query = select(
                    date_expr_sec.label("date"),
                    func.count(Transaction.id).label("total"),
                    func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud"),
                    func.avg(Transaction.risk_score).label("avg_risk")
                ).where(*conditions).group_by(
                    date_expr_sec
                ).order_by(
                    date_expr_sec.asc()
                )
                result = await self.db.execute(query)
                rows = result.all()
        else:
            query = select(
                func.cast(Transaction.created_at, Date).label("date"),
                func.count(Transaction.id).label("total"),
                func.sum(case((Transaction.is_fraud == True, 1), else_=0)).label("fraud"),
                func.avg(Transaction.risk_score).label("avg_risk")
            ).where(*conditions).group_by(
                func.cast(Transaction.created_at, Date)
            ).order_by(
                func.cast(Transaction.created_at, Date).asc()
            )
            result = await self.db.execute(query)
            rows = result.all()

        timeline = []
        for row in rows:
            dt_str = row.date.strftime("%Y-%m-%d") if hasattr(row.date, "strftime") else str(row.date)
            timeline.append({
                "date": dt_str,
                "total": row.total,
                "fraud": int(row.fraud or 0),
                "avg_risk": round(float(row.avg_risk or 0.0), 4)
            })
        return timeline
