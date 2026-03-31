PYTHON ?= python
PIP ?= pip
NPM ?= npm

.PHONY: backend-install backend-run backend-migrate frontend-install frontend-run frontend-build docker-up docker-down

backend-install:
	$(PIP) install -r backend/requirements.txt

backend-migrate:
	cd backend && alembic upgrade head

backend-run:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

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
