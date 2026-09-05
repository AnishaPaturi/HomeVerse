"""
Integration Test for Alembic Database Migrations (Phase 37)
Verifies that all migration scripts execute cleanly and match current models.
"""
from pathlib import Path
from alembic.config import Config
from alembic import command

def test_alembic_migrations_lifecycle():
    backend_dir = Path(__file__).resolve().parent.parent.parent
    alembic_ini = backend_dir / "alembic.ini"
    assert alembic_ini.exists(), "alembic.ini must exist"

    cfg = Config(str(alembic_ini))
    cfg.set_main_option("here", str(backend_dir))

    # 1. Verify schema is up-to-date
    command.upgrade(cfg, "head")

    # 2. Check that no uncommitted model changes exist
    command.check(cfg)
