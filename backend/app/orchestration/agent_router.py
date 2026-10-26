from app.agents.finance_agent import FinanceAgent
from app.agents.operations_agent import OperationsAgent
from app.agents.customer_agent import CustomerAgent
from app.agents.marketing_agent import MarketingAgent

_REGISTRY = {
    "finance_agent": FinanceAgent(),
    "operations_agent": OperationsAgent(),
    "customer_agent": CustomerAgent(),
    "marketing_agent": MarketingAgent(),
}


def route(agent_name: str):
    agent = _REGISTRY.get(agent_name)
    if agent is None:
        raise ValueError(f"No agent registered for '{agent_name}'")
    return agent
