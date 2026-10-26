"""
Tracks active WebSocket connections per business and broadcasts
real agent execution events to them. This is what the Live Agent
Activity Dashboard subscribes to — no hardcoded/fake events, every
message here is emitted by the orchestration engine as it runs.
"""
import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, business_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[business_id].append(websocket)

    def disconnect(self, business_id: str, websocket: WebSocket):
        if websocket in self._connections.get(business_id, []):
            self._connections[business_id].remove(websocket)

    async def broadcast(self, business_id: str, event: dict):
        dead = []
        for ws in self._connections.get(business_id, []):
            try:
                await ws.send_text(json.dumps(event, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(business_id, ws)


manager = ConnectionManager()
