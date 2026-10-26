"""
Creates all tables on startup if they don't already exist.
This is what gives us "business memory" that survives restarts —
SQLite/Postgres data is persisted to disk, and we never drop tables here.
"""
from app.database.base import Base
from app.database.session import engine
import app.models  # noqa: F401  (ensures all models are registered on Base.metadata)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
