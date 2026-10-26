"""
Marketing tools: campaign content generation.
Called by the Marketing Agent. Campaign *launches* always go through
the ApprovalRequest flow — this module only generates proposals/content,
it never spends money or "launches" anything on its own.
"""
from app.services.llm_provider import get_llm_provider


async def generate_campaign_proposal(business_name: str, goal: str) -> dict:
    provider = get_llm_provider()
    text = await provider.generate_text(
        system_prompt=(
            "You are the Marketing Agent for a small business. Propose ONE short promotional "
            "campaign idea (2-3 sentences) plus a catchy one-line social caption."
        ),
        user_prompt=f"Business: {business_name}. Goal: {goal}",
    )
    if text.startswith("[rule-based]"):
        text = (
            f"Run a limited-time weekend promotion for {business_name} to boost engagement: "
            f"offer a small discount and post a countdown story on Instagram."
        )
        caption = f"✨ This weekend only at {business_name} — don't miss out! ✨"
    else:
        caption = f"✨ Something special is happening at {business_name} — stay tuned! ✨"

    return {
        "proposal": text,
        "caption": caption,
        "estimated_cost": 2000.0,
    }
