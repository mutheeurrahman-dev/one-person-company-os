from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.approval import ApprovalRequest, ApprovalStatus
from app.schemas.agents import ApprovalResponse, ApprovalDecision
from app.services.deps import get_current_business
from app.services.approval_service import resolve_approval

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


@router.get("", response_model=list[ApprovalResponse])
async def list_approvals(
    business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
    status_filter: str | None = None,
):
    query = select(ApprovalRequest).where(ApprovalRequest.business_id == business.id)
    if status_filter:
        query = query.where(ApprovalRequest.status == ApprovalStatus(status_filter))
    result = await db.execute(query.order_by(ApprovalRequest.created_at.desc()))
    return result.scalars().all()


@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
async def decide_approval(
    approval_id: str, payload: ApprovalDecision,
    business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    try:
        approval = await resolve_approval(db, approval_id, business.id, payload.approve)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return approval
