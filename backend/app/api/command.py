from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.schemas.agents import CommandRequest
from app.services.deps import get_current_business
from app.orchestration.workflow_engine import run_workflow

router = APIRouter(prefix="/api/command", tags=["command"])


@router.post("")
async def submit_command(
    payload: CommandRequest, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    """
    The AI Command Box. Free-text business requests are handed to the
    Manager Agent, which decomposes and orchestrates the full workflow.
    """
    result = await run_workflow(db, business.id, business.name, payload.text)
    return result
