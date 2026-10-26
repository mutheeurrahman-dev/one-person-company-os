"""
Failure handler: decides what to do when a task raises an exception.
Real retry logic (not simulated) — retries the same task up to max_retries
times before marking it (and the workflow) as failed.
"""
from app.models.agent_task import AgentTask, TaskStatus


class FailureDecision:
    RETRY = "retry"
    FAIL = "fail"


def decide(task: AgentTask) -> str:
    if task.retry_count < task.max_retries:
        return FailureDecision.RETRY
    return FailureDecision.FAIL
