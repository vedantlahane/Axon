# Backend Test Suite

## Included tests

- `test_agent_pipeline.py`: Agent pipeline behavior and tool activation checks.
- `test_agent_chat_api.py`: Chat endpoint integration with assistant response assertions.
- `test_agent_model_preferences.py`: Model preference API and chat continuity checks.
- `test_api_end_to_end.py`: End-to-end API flow (auth, docs, chat, export, feedback, prefs, DB upload).
- `test_agent_live_provider.py`: Optional live LLM provider verification.

## Run keyless suite

```bash
python -m unittest -v \
  backend.tests.test_agent_pipeline \
  backend.tests.test_agent_chat_api \
  backend.tests.test_agent_model_preferences \
  backend.tests.test_api_end_to_end
```

## Run live provider suite

At least one key is required: `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`.

```bash
AXON_RUN_LIVE_PROVIDER_TESTS=1 python -m unittest -v backend.tests.test_agent_live_provider
```

If live flag is not enabled or keys are missing, the live provider test is skipped.
