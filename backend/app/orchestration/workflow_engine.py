"""
Workflow engine: the real orchestration loop.

USER -> MANAGER AGENT -> TASK DECOMPOSITION -> AGENT SELECTION ->
SPECIALIZED AGENTS -> TOOL EXECUTION -> MANAGER AGENT ->
HUMAN APPROVAL IF REQUIRED -> FINAL RESULT

Every step is persisted (Workflow/AgentTask/AgentExecution/AgentMessage rows)
and broadcast live over WebSocket. Failures are retried via failure_handler
before the workflow is marked failed.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.manager_agent import decompose_request
from app.models.agent_task import TaskStatus, AgentTask
from app.models.approval import ApprovalRequest, ApprovalStatus
from app.orchestration import task_manager as tm
from app.orchestration import agent_router
from app.orchestration.failure_handler import decide, FailureDecision
from app.services.insight_engine import generate_insights


async def run_workflow(db: AsyncSession, business_id: str, business_name: str, user_request: str) -> dict:
    workflow = await tm.create_workflow(db, business_id, user_request)

    await tm.log_execution(
        db, workflow.id, business_id, "manager_agent", "started",
        f"Analyzing business request: \"{user_request}\"",
    )

    task_specs = decompose_request(user_request, business_name)

    if not task_specs:
        await tm.update_workflow_status(db, workflow, TaskStatus.FAILED, "Could not understand the request.")
        await tm.log_execution(db, workflow.id, business_id, "manager_agent", "failed",
                                "Could not decompose the request into any known tasks.")
        return {"workflow_id": workflow.id, "status": "failed"}

    await tm.log_execution(
        db, workflow.id, business_id, "manager_agent", "success",
        f"Decomposed request into {len(task_specs)} task(s), delegating to specialized agents.",
    )

    results = []
    pending_approval = None
    context: dict = {}  # accumulates outputs so later tasks can use earlier tasks' results

    for seq, spec in enumerate(task_specs):
        agent_name = spec["agent"]
        payload = _enrich_payload(spec["action"], spec["payload"], context)
        task = await tm.create_task(
            db, workflow, business_id, agent_name, spec["action"], payload, seq,
        )
        await tm.log_message(
            db, workflow.id, "manager_agent", agent_name, spec["action"], payload, task.id,
        )

        if spec.get("requires_approval"):
            result = await _execute_with_retries(db, workflow.id, business_id, task)
            if result is None:
                pending_approval = None
                break  # task failed permanently; stop the chain

            approval = ApprovalRequest(
                workflow_id=workflow.id,
                task_id=task.id,
                business_id=business_id,
                requesting_agent=agent_name,
                action_title=result.get("proposal", "Proposed action")[:120],
                description=result.get("proposal"),
                estimated_cost=result.get("estimated_cost", 0.0),
                reason="Potential increase in customer engagement",
                payload=result,
                status=ApprovalStatus.PENDING,
            )
            db.add(approval)
            await db.flush()
            await db.commit()

            await tm.update_task_status(db, task, TaskStatus.WAITING_APPROVAL, result=result)
            await tm.log_execution(
                db, workflow.id, business_id, "manager_agent", "waiting_approval",
                f"{agent_name} proposed an action requiring human approval: {approval.action_title}",
            )
            await tm.update_workflow_status(
                db, workflow, TaskStatus.WAITING_APPROVAL,
                "Waiting for human approval before proceeding.",
            )
            pending_approval = approval
            results.append({"agent": agent_name, "action": spec["action"], "result": result})
            break

        result = await _execute_with_retries(db, workflow.id, business_id, task)
        if result is None:
            await tm.update_workflow_status(
                db, workflow, TaskStatus.FAILED,
                f"Workflow failed at task '{spec['action']}' assigned to {agent_name}.",
            )
            return {"workflow_id": workflow.id, "status": "failed", "results": results}

        results.append({"agent": agent_name, "action": spec["action"], "result": result})
        context.update(result)

    if pending_approval is not None:
        return {"workflow_id": workflow.id, "status": "waiting_approval", "results": results}

    summary = _summarize(results)
    await tm.update_workflow_status(db, workflow, TaskStatus.COMPLETED, summary)
    await tm.log_execution(db, workflow.id, business_id, "manager_agent", "success",
                            f"Workflow completed. {summary}")

    # Manager Agent reviews the outcome and refreshes business insights
    # (unusual spending, low stock, profitability) based on what just happened.
    await generate_insights(db, business_id)

    return {"workflow_id": workflow.id, "status": "completed", "results": results, "summary": summary}


async def _execute_with_retries(db: AsyncSession, workflow_id: str, business_id: str, task: AgentTask) -> dict | None:
    agent = agent_router.route(task.assigned_agent.value)
    await tm.update_task_status(db, task, TaskStatus.RUNNING)
    await tm.log_execution(
        db, workflow_id, business_id, task.assigned_agent.value, "started",
        f"{_verb(task.action)}...", task.id,
    )

    while True:
        try:
            result = await agent.execute(db, task, business_id)
            await tm.update_task_status(db, task, TaskStatus.COMPLETED, result=result)
            await tm.log_execution(
                db, workflow_id, business_id, task.assigned_agent.value, "success",
                f"{_verb(task.action)} — done.", task.id,
            )
            return result
        except Exception as exc:
            task.retry_count += 1
            decision = decide(task)
            await db.flush()
            await db.commit()

            if decision == FailureDecision.RETRY:
                await tm.update_task_status(db, task, TaskStatus.RETRYING, error=str(exc))
                await tm.log_execution(
                    db, workflow_id, business_id, task.assigned_agent.value, "retrying",
                    f"{task.assigned_agent.value} failed ({exc}). Manager Agent retrying "
                    f"(attempt {task.retry_count}/{task.max_retries})...", task.id,
                )
                continue

            await tm.update_task_status(db, task, TaskStatus.FAILED, error=str(exc))
            await tm.log_execution(
                db, workflow_id, business_id, task.assigned_agent.value, "failed",
                f"{task.assigned_agent.value} failed permanently: {exc}", task.id,
            )
            await tm.log_execution(
                db, workflow_id, business_id, "manager_agent", "failed",
                f"Manager Agent: task '{task.action}' could not be completed after "
                f"{task.retry_count} attempt(s). Marking workflow as failed.",
            )
            return None


def _enrich_payload(action: str, payload: dict, context: dict) -> dict:
    """
    Fills in values that depend on the output of an earlier task in the same
    workflow (e.g. the order total computed by Operations feeds Finance's
    record_revenue). This is the actual agent-to-agent handoff mechanism.
    """
    enriched = dict(payload)
    if action == "record_revenue" and "amount" not in enriched:
        enriched["amount"] = context.get("total_amount", 0.0)
        if "order_id" not in enriched and "order_id" in context:
            enriched["order_id"] = context["order_id"]
    if action == "generate_confirmation":
        if "product_name" not in enriched and "product_name" in context:
            enriched["product_name"] = context["product_name"]
        if "quantity" not in enriched and "quantity" in context:
            enriched["quantity"] = context["quantity"]
    return enriched


def _verb(action: str) -> str:
    return {
        "check_inventory": "Checking inventory",
        "process_order": "Processing order",
        "record_revenue": "Updating revenue",
        "record_expense": "Recording expense",
        "get_summary": "Generating financial summary",
        "find_or_create_customer": "Looking up customer",
        "generate_confirmation": "Generating customer confirmation message",
        "check_low_stock": "Scanning for low-stock items",
        "propose_campaign": "Drafting marketing campaign proposal",
    }.get(action, action.replace("_", " ").capitalize())


def _summarize(results: list[dict]) -> str:
    parts = []
    for r in results:
        agent = r["agent"].replace("_agent", "").capitalize()
        parts.append(f"{agent} completed '{r['action']}'")
    return "; ".join(parts) + "." if parts else "No tasks were executed."
