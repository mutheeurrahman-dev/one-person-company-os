from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_task import AgentTask


class BaseAgent(ABC):
    name: str = "base_agent"

    @abstractmethod
    async def execute(self, db: AsyncSession, task: AgentTask, business_id: str) -> dict:
        """
        Execute the given task's action. Must return a JSON-serializable dict result.
        Raise an exception on failure — the orchestration engine handles retries/failure.
        """
        raise NotImplementedError
