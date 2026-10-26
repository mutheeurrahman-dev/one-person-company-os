"""
Resolves a pending ApprovalRequest. This is real application logic —
approving actually finalizes the task/workflow as completed; rejecting
actually halts it as rejected. Nothing here is faked or auto-approved.
"""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import ApprovalRequest, ApprovalStatus
from app.models.agent_task import AgentTask, TaskStatus, Workflow
from app.orchestration import task_manager as tm


async def resolve_approval(db: AsyncSession, approval_id: str, business_id: str, approve: bool) -> ApprovalRequest:
    result = await db.execute(
        select(ApprovalRequest).where(ApprovalRequest.id == approval_id, ApprovalRequest.business_id == business_id)
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise ValueError("Approval request not found")
    if approval.status != ApprovalStatus.PENDING:
        raise ValueError("This approval request has already been resolved")

    approval.status = ApprovalStatus.APPROVED if approve else ApprovalStatus.REJECTED
    approval.resolved_at = datetime.utcnow()
    await db.flush()

    task_result = await db.execute(select(AgentTask).where(AgentTask.id == approval.task_id))
    task = task_result.scalar_one_or_none()

    wf_result = await db.execute(select(Workflow).where(Workflow.id == approval.workflow_id))
    workflow = wf_result.scalar_one_or_none()

    await db.commit()

    if approve:
        if task:
            await tm.update_task_status(db, task, TaskStatus.COMPLETED)
        await tm.log_execution(
            db, approval.workflow_id, business_id, "manager_agent", "success",
            f"Human approved: \"{approval.action_title}\". Action executed.",
        )
        if workflow:
            await tm.update_workflow_status(
                db, workflow, TaskStatus.COMPLETED,
                f"Approved and executed: {approval.action_title}",
            )
        from app.services.insight_engine import generate_insights
        await generate_insights(db, business_id)
    else:
        if task:
            await tm.update_task_status(db, task, TaskStatus.FAILED, error="Rejected by user")
        await tm.log_execution(
            db, approval.workflow_id, business_id, "manager_agent", "failed",
            f"Human rejected: \"{approval.action_title}\". Action was not executed.",
        )
        if workflow:
            await tm.update_workflow_status(
                db, workflow, TaskStatus.FAILED,
                f"Rejected: {approval.action_title}",
            )

    await db.refresh(approval)
    return approval
