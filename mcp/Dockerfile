FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt /tmp/backend-requirements.txt
COPY mcp/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/backend-requirements.txt -r /tmp/requirements.txt

COPY backend /app/backend
COPY mcp /app/mcp

EXPOSE 8001

CMD ["uvicorn", "mcp.server:mcp_server", "--host", "0.0.0.0", "--port", "8001"]
