import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
import sqlalchemy as sa

from alembic import context

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.db.base import Base
from app.db.guid import GUID
# Import all models to register them in Base.metadata
import app.models

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set database URL dynamically from environment or settings if available
from app.config import settings
db_url = os.getenv("DATABASE_URL", getattr(settings, "DATABASE_URL", None))
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

target_metadata = Base.metadata

def compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):
    """
    Custom type comparator to avoid false-positive schema diffs
    between SQLite's generic NUMERIC/TEXT storage and SQLAlchemy's UUID/GUID types.
    """
    if context.dialect.name == "sqlite":
        if isinstance(metadata_type, (sa.UUID, GUID)) and isinstance(
            inspected_type, (sa.NUMERIC, sa.VARCHAR, sa.TEXT, sa.CHAR)
        ):
            return False
    return None

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=compare_type,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
            compare_type=compare_type,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
