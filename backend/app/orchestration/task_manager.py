"""
Task manager: owns creation/updating of Workflow, AgentTask, AgentExecution
and AgentMessage rows, and broadcasts every state change over WebSocket so
the Live Agent Activity Dashboard reflects real backend execution — nothing
here is a hardcoded/fake log line.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_task import Workflow, AgentTask, AgentExecution, AgentMessage, TaskStatus, AgentName
from app.websocket.connection_manager import manager as ws_manager


async def create_workflow(db: AsyncSession, business_id: str, user_request: str) -> Workflow:
    wf = Workflow(business_id=business_id, user_request=user_request, status=TaskStatus.RUNNING)
    db.add(wf)
    await db.flush()
    await db.commit()
    await db.refresh(wf)
    return wf


async def create_task(
    db: AsyncSession, workflow: Workflow, business_id: str, agent: str,
    action: str, payload: dict, sequence: int,
) -> AgentTask:
    task = AgentTask(
        workflow_id=workflow.id,
        business_id=business_id,
        assigned_agent=AgentName(agent),
        action=action,
        payload=payload,
        status=TaskStatus.PENDING,
        sequence=sequence,
    )
    db.add(task)
    await db.flush()
    await db.commit()
    await db.refresh(task)
    return task


async def log_execution(
    db: AsyncSession, workflow_id: str, business_id: str, agent: str,
    status: str, message: str, task_id: str | None = None,
) -> AgentExecution:
    execution = AgentExecution(
        workflow_id=workflow_id, business_id=business_id, agent=AgentName(agent),
        status=status, message=message, task_id=task_id,
    )
    db.add(execution)
    await db.flush()
    await db.commit()
    await db.refresh(execution)

    await ws_manager.broadcast(business_id, {
        "type": "agent_execution",
        "workflow_id": workflow_id,
        "task_id": task_id,
        "agent": agent,
        "status": status,
        "message": message,
        "created_at": str(execution.created_at),
    })
    return execution


async def log_message(
    db: AsyncSession, workflow_id: str, sender: str, receiver: str,
    action: str, payload: dict, task_id: str | None = None,
) -> AgentMessage:
    msg = AgentMessage(
        workflow_id=workflow_id, task_id=task_id, sender=AgentName(sender),
        receiver=AgentName(receiver), action=action, payload=payload,
    )
    db.add(msg)
    await db.flush()
    await db.commit()
    return msg


async def update_task_status(
    db: AsyncSession, task: AgentTask, status: TaskStatus,
    result: dict | None = None, error: str | None = None,
) -> AgentTask:
    task.status = status
    if result is not None:
        task.result = result
    if error is not None:
        task.error = error
    await db.flush()
    await db.commit()
    await db.refresh(task)
    return task


async def update_workflow_status(
    db: AsyncSession, workflow: Workflow, status: TaskStatus, result_summary: str | None = None,
) -> Workflow:
    workflow.status = status
    if result_summary is not None:
        workflow.result_summary = result_summary
    await db.flush()
    await db.commit()
    await db.refresh(workflow)

    await ws_manager.broadcast(workflow.business_id, {
        "type": "workflow_update",
        "workflow_id": workflow.id,
        "status": status.value,
        "result_summary": result_summary,
    })
    return workflow
