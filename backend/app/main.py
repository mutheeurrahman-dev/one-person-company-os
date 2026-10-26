from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database.init_db import init_db

from app.api import auth, dashboard, orders, customers, finance, inventory, approvals, insights, agents, command
from app.websocket import ws_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(orders.router)
app.include_router(customers.router)
app.include_router(finance.router)
app.include_router(inventory.router)
app.include_router(approvals.router)
app.include_router(insights.router)
app.include_router(agents.router)
app.include_router(command.router)
app.include_router(ws_router.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
