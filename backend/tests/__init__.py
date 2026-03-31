"""Backend test package for Axon."""

import warnings

# Third-party ecosystem warnings on Python 3.14 that are outside this repo's code.
warnings.filterwarnings(
	'ignore',
	message=r"Core Pydantic V1 functionality isn't compatible with Python 3\\.14 or greater\\.",
	category=UserWarning,
	module=r'langchain_core\\._api\\.deprecation',
)
warnings.filterwarnings(
	'ignore',
	message=r".*iscoroutinefunction.*",
	category=DeprecationWarning,
	module=r'langgraph\\._internal\\._runnable',
)
