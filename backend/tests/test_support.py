from __future__ import annotations

import os
import subprocess
import sys
import threading
from pathlib import Path

_DB_READY = False
_DB_LOCK = threading.Lock()


def _to_sync_database_url(database_url: str) -> str:
    if database_url.startswith('sqlite+aiosqlite:///'):
        return database_url.replace('sqlite+aiosqlite:///', 'sqlite:///', 1)

    if database_url.startswith('postgresql+asyncpg://'):
        return database_url.replace('postgresql+asyncpg://', 'postgresql://', 1)

    return database_url


def _normalize_sqlite_url(database_url: str, workspace_dir: Path) -> str:
    if not database_url.startswith('sqlite:///'):
        return database_url

    raw_path = database_url.replace('sqlite:///', '', 1)
    db_path = Path(raw_path)
    if not db_path.is_absolute():
        db_path = (workspace_dir / db_path).resolve()

    return f"sqlite:///{db_path.as_posix()}"


def ensure_database_schema() -> None:
    global _DB_READY

    if _DB_READY:
        return

    with _DB_LOCK:
        if _DB_READY:
            return

        backend_dir = Path(__file__).resolve().parents[1]
        workspace_dir = backend_dir.parent
        env = os.environ.copy()

        database_url = env.get('DATABASE_URL') or f"sqlite+aiosqlite:///{(backend_dir / 'axon.db').as_posix()}"
        sync_url = _to_sync_database_url(database_url)
        env['ALEMBIC_DATABASE_URL'] = _normalize_sqlite_url(sync_url, workspace_dir)

        subprocess.run(
            [sys.executable, '-m', 'alembic', 'upgrade', 'head'],
            cwd=str(backend_dir),
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
        _DB_READY = True
