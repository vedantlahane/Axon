"""Test-time warning filters for third-party Python 3.14 compatibility noise."""

import atexit
import asyncio
import inspect
import warnings

from backend.database import engine

warnings.filterwarnings(
    'ignore',
    message=r"Core Pydantic V1 functionality isn't compatible with Python 3\.14 or greater\.",
    category=UserWarning,
)

warnings.filterwarnings(
    'ignore',
    message=r"'asyncio\.iscoroutinefunction' is deprecated.*",
    category=DeprecationWarning,
    module=r'langgraph\._internal\._runnable',
)

warnings.filterwarnings(
    'ignore',
    message=r"<aiosqlite\.core\.Connection object .* was deleted before being closed.*",
    category=ResourceWarning,
    module=r'aiosqlite\.core',
)

warnings.filterwarnings(
    'ignore',
    category=ResourceWarning,
    module=r'aiosqlite\.core',
)

# Keep langgraph on a non-deprecated coroutine check path on Python 3.14+.
asyncio.iscoroutinefunction = inspect.iscoroutinefunction


def _dispose_engine_at_exit() -> None:
    try:
        asyncio.run(engine.dispose())
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(engine.dispose())
        finally:
            loop.close()


atexit.register(_dispose_engine_at_exit)
