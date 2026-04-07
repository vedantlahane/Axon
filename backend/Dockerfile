# backend/Dockerfile

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM python:3.13-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 2: Production image
# ============================================
FROM python:3.13-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system axon \
    && adduser --system --ingroup axon axon

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# ─────────────────────────────────────────────
# KEY: We set WORKDIR to /app (the PARENT of backend/)
# Then copy backend/ AS backend/ so imports work
# ─────────────────────────────────────────────
WORKDIR /app

# Copy backend code as a package directory
COPY . /app/backend/

# Create uploads directory
RUN mkdir -p /app/backend/uploads \
    && chown -R axon:axon /app

USER axon

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run from /app so "backend.main:app" resolves correctly
CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2"]