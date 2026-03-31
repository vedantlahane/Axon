PYTHON ?= python
PIP ?= pip
NPM ?= npm

.PHONY: backend-install backend-run backend-migrate backend-test backend-test-live frontend-install frontend-run frontend-build docker-up docker-down

backend-install:
	$(PIP) install -r backend/requirements.txt

backend-migrate:
	cd backend && alembic upgrade head

backend-run:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

backend-test:
	$(PYTHON) -m unittest -v backend.tests.test_agent_pipeline backend.tests.test_agent_chat_api backend.tests.test_agent_model_preferences backend.tests.test_api_end_to_end

backend-test-live:
	AXON_RUN_LIVE_PROVIDER_TESTS=1 $(PYTHON) -m unittest -v backend.tests.test_agent_live_provider

frontend-install:
	cd frontend && $(NPM) install

frontend-run:
	cd frontend && $(NPM) run dev

frontend-build:
	cd frontend && $(NPM) run build

docker-up:
	docker compose up --build

docker-down:
	docker compose down
