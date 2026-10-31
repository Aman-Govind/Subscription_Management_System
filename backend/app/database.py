"""Shared SQLAlchemy engine, session factory, and declarative base."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# Creating an engine is configuration-only; it does not open a MySQL connection.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class inherited by every SQLAlchemy ORM model."""


def get_db() -> Generator[Session, None, None]:
    """Yield one database session and reliably close it after the request."""
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()
