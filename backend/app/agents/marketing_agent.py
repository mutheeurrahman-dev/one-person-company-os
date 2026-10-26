from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base_agent import BaseAgent
from app.models.agent_task import AgentTask
from app.tools import marketing_tools


class MarketingAgent(BaseAgent):
    name = "marketing_agent"

    async def execute(self, db: AsyncSession, task: AgentTask, business_id: str) -> dict:
        action = task.action
        payload = task.payload or {}

        if action == "propose_campaign":
            proposal = await marketing_tools.generate_campaign_proposal(
                payload.get("business_name", "your business"),
                payload.get("goal", "increase customer engagement"),
            )
            # This action ALWAYS requires human approval before anything is "launched" —
            # the workflow engine intercepts this and creates an ApprovalRequest instead
            # of treating it as a completed, spent action.
            return proposal

        raise ValueError(f"Unknown action for MarketingAgent: {action}")
