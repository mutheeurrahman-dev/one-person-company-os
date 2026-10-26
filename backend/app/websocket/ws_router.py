from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.user import User, Business
from app.services.auth_service import decode_access_token
from app.websocket.connection_manager import manager

router = APIRouter()


@router.websocket("/ws/activity")
async def activity_feed(websocket: WebSocket, token: str = Query(...)):
    user_id = decode_access_token(token)
    if user_id is None:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            await websocket.close(code=4401)
            return

        biz_result = await db.execute(select(Business).where(Business.owner_id == user.id))
        business = biz_result.scalar_one_or_none()
        if business is None:
            await websocket.close(code=4404)
            return

    await manager.connect(business.id, websocket)
    try:
        while True:
            # We don't expect incoming messages, but keep the connection alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(business.id, websocket)
