from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.user import Business
from app.models.agent_task import Workflow, AgentTask, AgentExecution
from app.schemas.agents import WorkflowResponse, AgentExecutionResponse
from app.services.deps import get_current_business

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/workflows", response_model=list[WorkflowResponse])
async def list_workflows(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.business_id == business.id).order_by(Workflow.created_at.desc()).limit(50)
    )
    workflows = result.scalars().all()
    response = []
    for wf in workflows:
        tasks_result = await db.execute(select(AgentTask).where(AgentTask.workflow_id == wf.id))
        wf_dict = WorkflowResponse.model_validate(wf)
        wf_dict.tasks = tasks_result.scalars().all()
        response.append(wf_dict)
    return response


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id, Workflow.business_id == business.id)
    )
    wf = result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    tasks_result = await db.execute(select(AgentTask).where(AgentTask.workflow_id == wf.id))
    wf_response = WorkflowResponse.model_validate(wf)
    wf_response.tasks = tasks_result.scalars().all()
    return wf_response


@router.get("/activity", response_model=list[AgentExecutionResponse])
async def recent_activity(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentExecution)
        .where(AgentExecution.business_id == business.id)
        .order_by(AgentExecution.created_at.desc())
        .limit(100)
    )
    return list(reversed(result.scalars().all()))
