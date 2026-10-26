"""
Manager Agent: the coordinator. Understands the user's natural-language
business request and decomposes it into a structured, ordered list of tasks
for specialized agents to execute (task decomposition + agent selection).

Uses fast rule-based intent detection (reliable, deterministic, no API-key
dependency) enriched with LLM-generated content where an LLM is configured
(e.g. customer messages, marketing copy) via the specialized agents/tools.
"""
import re


def _extract_quantity(text: str, default: int = 1) -> int:
    match = re.search(r"\b(\d+)\b", text)
    return int(match.group(1)) if match else default


def _extract_amount(text: str) -> float | None:
    """Pulls the first currency-like number out of the text, e.g. '₹1,200', '$500', '1200.50'."""
    match = re.search(r"[₹$]?\s?(\d[\d,]*\.?\d*)", text)
    if not match:
        return None
    raw = match.group(1).replace(",", "")
    try:
        value = float(raw)
        return value if value > 0 else None
    except ValueError:
        return None


def _extract_category(text: str) -> str:
    match = re.search(r"\bfor\s+([a-zA-Z][a-zA-Z\s]{2,40}?)(?:\.|$)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "general"


def _extract_product(text: str) -> str:
    # naive noun guess: look for common product words after a quantity, else fallback
    match = re.search(r"\d+\s+([a-zA-Z][a-zA-Z\s]{2,20}?)(?:\s+and|\s+for|\.|$)", text)
    if match:
        return match.group(1).strip().rstrip("s") if match.group(1).strip() else "item"
    return "item"


def decompose_request(text: str, business_name: str) -> list[dict]:
    """
    Returns an ordered list of task specs:
    {agent, action, payload, requires_approval}
    """
    lower = text.lower()
    tasks: list[dict] = []

    is_order_request = "order" in lower or "process" in lower
    wants_followup = "follow up" in lower or "confirmation" in lower or "notify" in lower

    if is_order_request and any(w in lower for w in ["order", "buy", "purchase"]):
        quantity = _extract_quantity(text, default=1)
        product = _extract_product(text)
        customer_match = re.search(r"customer\s+([A-Z][a-zA-Z]+)", text)
        customer_name = customer_match.group(1) if customer_match else "Guest Customer"

        tasks.append({
            "agent": "operations_agent", "action": "check_inventory",
            "payload": {"product_name": product, "quantity": quantity},
            "requires_approval": False,
        })
        tasks.append({
            "agent": "operations_agent", "action": "process_order",
            "payload": {"product_name": product, "quantity": quantity},
            "requires_approval": False,
        })
        tasks.append({
            "agent": "finance_agent", "action": "record_revenue",
            "payload": {"category": "sales", "description": f"Order: {quantity} x {product}"},
            "requires_approval": False,
        })
        if wants_followup or True:  # confirmation is core to the documented workflow
            tasks.append({
                "agent": "customer_agent", "action": "find_or_create_customer",
                "payload": {"customer_name": customer_name},
                "requires_approval": False,
            })
            tasks.append({
                "agent": "customer_agent", "action": "generate_confirmation",
                "payload": {"customer_name": customer_name, "product_name": product, "quantity": quantity},
                "requires_approval": False,
            })
        return tasks

    if any(w in lower for w in ["expense", "spent", "spend", "cost me", "bought"]) and "revenue" not in lower:
        amount = _extract_amount(text)
        if amount is not None:
            category = _extract_category(text)
            tasks.append({
                "agent": "finance_agent", "action": "record_expense",
                "payload": {"amount": amount, "category": category, "description": text},
                "requires_approval": False,
            })
            return tasks

    if "revenue" in lower and any(w in lower for w in ["record", "log", "add"]):
        amount = _extract_amount(text)
        if amount is not None:
            category = _extract_category(text)
            tasks.append({
                "agent": "finance_agent", "action": "record_revenue",
                "payload": {"amount": amount, "category": category, "description": text},
                "requires_approval": False,
            })
            return tasks

    if any(w in lower for w in ["running out", "running low", "low stock", "low-stock", "check inventory", "which products"]):
        tasks.append({
            "agent": "operations_agent", "action": "check_low_stock",
            "payload": {}, "requires_approval": False,
        })
        return tasks

    if any(w in lower for w in ["marketing", "campaign", "promotion", "promote", "advertise", "instagram"]):
        tasks.append({
            "agent": "marketing_agent", "action": "propose_campaign",
            "payload": {"business_name": business_name, "goal": text},
            "requires_approval": True,
        })
        return tasks

    if any(w in lower for w in ["performance", "revenue", "profit", "financial", "how much", "summary"]):
        tasks.append({
            "agent": "finance_agent", "action": "get_summary",
            "payload": {}, "requires_approval": False,
        })
        return tasks

    # Fallback: treat as a general financial summary + low-stock check so the
    # user always gets *something* useful back rather than a dead end.
    tasks.append({
        "agent": "finance_agent", "action": "get_summary",
        "payload": {}, "requires_approval": False,
    })
    return tasks
