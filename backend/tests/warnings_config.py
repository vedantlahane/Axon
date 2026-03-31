"""Test-time warning filters for third-party Python 3.14 compatibility noise."""

import warnings

warnings.filterwarnings(
    'ignore',
    message=r"Core Pydantic V1 functionality isn't compatible with Python 3\\.14 or greater\\.",
    category=UserWarning,
)

warnings.filterwarnings(
    'ignore',
    message=r"'asyncio\\.iscoroutinefunction' is deprecated.*",
    category=DeprecationWarning,
)

warnings.filterwarnings(
    'ignore',
    message=r"<aiosqlite\\.core\\.Connection object .* was deleted before being closed.*",
    category=ResourceWarning,
)
